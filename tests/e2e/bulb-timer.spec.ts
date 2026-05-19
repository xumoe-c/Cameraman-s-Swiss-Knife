import { test, expect, type Page } from '@playwright/test';

async function selectNd(page: Page, label: string) {
  const ndMain = page.locator('[data-testid="nd-switch-value"] .exposure-picker-main');

  for (let i = 0; i < 60; i++) {
    const current = await ndMain.textContent();
    if (current?.trim() === label) return;

    await page.locator('[data-testid="nd-switch-next"]').click();
    await page.waitForTimeout(30);
  }

  await expect(ndMain).toHaveText(label);
}

test.describe('曝光计算器 (Exposure Calculator)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /曝光/ }).click();
    await expect(page.locator('[data-testid="exposure-page"]')).toBeVisible();
  });

  test('页面加载验证默认参数显示', async ({ page }) => {
    // 验证主要控件可见
    await expect(page.locator('[data-testid="solve-for-select"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="nd-switch-value"]')).toBeVisible();
    await expect(page.locator('[data-testid="base-shutter-value"]')).toBeVisible();
    await expect(page.locator('[data-testid="comp-value"]')).toBeVisible();

    // 验证默认值显示（滚轮式控件）
    const ndVal = page.locator('[data-testid="nd-switch-value"]');
    await expect(ndVal).toContainText('ND512000');

    // 验证截图参考态的长曝光结果
    await expect(page.locator('[data-testid="base-shutter-value"]')).toHaveText('2.5');
    await expect(page.locator('[data-testid="nd-shutter-result"]')).toHaveText('364:05:20');
    await expect(page.locator('[data-testid="exposure-bulb-timer"]')).toBeVisible();
  });

  

  test('调整快门，验证结果变化', async ({ page }) => {
    const resultDisplay = page.locator('[data-testid="nd-shutter-result"]');
    const initialResult = await resultDisplay.textContent();

    // 通过滚轮选择基础快门到 1s（循环尝试）
    for (let i = 0; i < 40; i++) {
      await page.locator('[data-testid="base-shutter-next"]').click();
      await page.waitForTimeout(50);
      const val = await page.locator('[data-testid="base-shutter-value"]').textContent();
      if (val?.trim() === '1') break;
    }

    await page.waitForTimeout(100);
    const newResult = await resultDisplay.textContent();
    expect(initialResult).not.toBe(newResult);
  });

  // ISO 调整已移除，相关用例跳过

  test('ND1000 选择触发 Bulb 倒计时模式', async ({ page }) => {
    // 选择 ND1000 后仍是长曝光，显示开始按钮
    await selectNd(page, 'ND1000');
    await page.waitForTimeout(100);
    const bulbPanel = page.locator('[data-testid="exposure-bulb-timer"]');
    await expect(bulbPanel).toBeVisible();
    await expect(page.locator('[data-testid="bulb-start-btn"]')).toHaveText('开始');
  });

  test('ND 预设切换验证档位显示', async ({ page }) => {
    // 切换到 ND1000
    await selectNd(page, 'ND1000');
    await page.waitForTimeout(100);
    let stopsText = await page.locator('[data-testid="nd-switch-value"]').textContent();
    expect(stopsText).toContain('10');

    // 切换到 ND64
    await selectNd(page, 'ND64');
    stopsText = await page.locator('[data-testid="nd-switch-value"]').textContent();
    expect(stopsText).toContain('6');

    // 切换到 ND2
    await selectNd(page, 'ND2');
    stopsText = await page.locator('[data-testid="nd-switch-value"]').textContent();
    expect(stopsText).toContain('1-STOP');
  });

  test('曝光补偿调整验证目标值变化', async ({ page }) => {
    // 为避免 Infinity 情况，先切到低 ND（当前固定为快门回推模式）
    await selectNd(page, 'ND2');
    await page.waitForTimeout(100);

    const ndShutterResult = page.locator('[data-testid="nd-shutter-result"]');
    const initialCompensated = await ndShutterResult.textContent();

    // 增加 1 EV 补偿 — 使用左右切换选择 +1.0EV
    for (let i = 0; i < 40; i++) {
      await page.locator('[data-testid="comp-next"]').click();
      await page.waitForTimeout(30);
      const val = await page.locator('[data-testid="comp-value"]').textContent();
      if (val && val.includes('+1')) break;
    }
    await page.waitForTimeout(200);

    const newCompensated = await ndShutterResult.textContent();
    if (initialCompensated === newCompensated) {
      expect(initialCompensated).toContain('Infinity');
    } else {
      expect(initialCompensated).not.toBe(newCompensated);
    }
  });

  test('互锁模式固定为快门', async ({ page }) => {
    const ndShutterResult = page.locator('[data-testid="nd-shutter-result"]');

    // 固定模式下结果应始终显示快门格式（使用 ND 调整后的结果）
    const resultText = await ndShutterResult.textContent();
    expect(resultText).toMatch(/(\d+:\d{2}:\d{2}|\d+\/\d+s|[\d.]+s)/);
  });

  test('互锁目标标题已替换为 ND 计算结果显示', async ({ page }) => {
    const ndShutterResult = page.locator('[data-testid="nd-shutter-result"]');
    await expect(ndShutterResult).toBeVisible();
  });

  test('Bulb 倒计时按钮可启动和重置', async ({ page }) => {
    const bulbPanel = page.locator('[data-testid="exposure-bulb-timer"]');
    await expect(bulbPanel).toBeVisible();

    const resultText = page.locator('[data-testid="nd-shutter-result"]');
    const initialText = await resultText.textContent();
    await page.locator('[data-testid="bulb-start-btn"]').click();
    await expect(page.locator('[data-testid="bulb-start-btn"]')).toHaveText('暂停');
    await page.waitForTimeout(600);
    const runningText = await resultText.textContent();
    expect(runningText).not.toBe(initialText);

    await page.locator('[data-testid="bulb-reset-btn"]').click();
    await expect(page.locator('[data-testid="bulb-start-btn"]')).toHaveText('开始');
    await expect(resultText).toHaveText(initialText ?? '');
  });

  test('快门显示格式符合规范', async ({ page }) => {
    const ndShutterResult = page.locator('[data-testid="nd-shutter-result"]');

    // 切换到 ND2，避免高 ND 档位把分数秒放大成长时间
    await selectNd(page, 'ND2');

    // 通过左右切换选择 1/250s
    for (let i = 0; i < 100; i++) {
      await page.locator('[data-testid="base-shutter-next"]').click();
      await page.waitForTimeout(20);
      const val = await page.locator('[data-testid="base-shutter-value"]').textContent();
      if (val && val.includes('1/250')) break;
    }
    await page.waitForTimeout(100);

    const shutterText = await ndShutterResult.textContent();
    // 应该显示 "1/250s" 或类似格式
    expect(shutterText).toMatch(/(\d+\/\d+s|[\d.]+s)/);
  });

  test('快门档位显示不会混淆相邻分数秒', async ({ page }) => {
    const shutterValue = page.locator('[data-testid="base-shutter-value"]');

    for (let i = 0; i < 80; i++) {
      await page.locator('[data-testid="base-shutter-prev"]').click();
      await page.waitForTimeout(20);
      const value = await shutterValue.textContent();
      if (value === '30') break;
    }
    await expect(shutterValue).toHaveText('30');

    for (let i = 0; i < 50; i++) {
      await page.locator('[data-testid="base-shutter-next"]').click();
      await page.waitForTimeout(20);
      const value = await shutterValue.textContent();
      if (value === '1/40s') break;
    }
    await expect(shutterValue).toHaveText('1/40s');

    await page.locator('[data-testid="base-shutter-next"]').click();
    await page.waitForTimeout(50);
    await expect(shutterValue).toHaveText('1/50s');
  });

  test('ND 档位信息完整性', async ({ page }) => {
    const ndShutterResult = page.locator('[data-testid="nd-shutter-result"]');

    // 选择一个高档位的 ND
    await selectNd(page, 'ND32000');
    await page.waitForTimeout(100);

    // 验证档位显示（ND32000 = 15 档）
    const stopsText = await page.locator('[data-testid="nd-switch-value"]').textContent();
    expect(stopsText).toContain('15');

    // 验证快门结果显示（应该是很长的时间）
    const shutterText = await ndShutterResult.textContent();
    expect(shutterText).toBeTruthy();
  });
});

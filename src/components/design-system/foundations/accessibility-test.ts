/**
 * WCAG 2.1 AA Accessibility Test Utility
 * 
 * Utility to validate color contrast ratios for accessibility compliance
 */

// Color contrast calculation utilities
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

export function isWCAGAACompliant(foreground: string, background: string): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= 4.5; // WCAG AA standard for normal text
}

export function isWCAGAAACompliant(foreground: string, background: string): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= 7; // WCAG AAA standard for normal text
}

// Test our luxury color combinations
export const luxuryColorAccessibilityTests = {
  // Primary combinations
  goldOnIvory: {
    foreground: '#B8941F', // Updated gold
    background: '#f8f6f0',  // Ivory
    contrastRatio: getContrastRatio('#B8941F', '#f8f6f0'),
    wcagAA: isWCAGAACompliant('#B8941F', '#f8f6f0'),
    wcagAAA: isWCAGAAACompliant('#B8941F', '#f8f6f0'),
  },
  
  charcoalOnIvory: {
    foreground: '#2c2c2c', // Charcoal
    background: '#f8f6f0',  // Ivory
    contrastRatio: getContrastRatio('#2c2c2c', '#f8f6f0'),
    wcagAA: isWCAGAACompliant('#2c2c2c', '#f8f6f0'),
    wcagAAA: isWCAGAAACompliant('#2c2c2c', '#f8f6f0'),
  },
  
  verdeOnIvory: {
    foreground: '#4a5d23', // Verde
    background: '#f8f6f0',  // Ivory
    contrastRatio: getContrastRatio('#4a5d23', '#f8f6f0'),
    wcagAA: isWCAGAACompliant('#4a5d23', '#f8f6f0'),
    wcagAAA: isWCAGAAACompliant('#4a5d23', '#f8f6f0'),
  },
  
  ivoryOnCharcoal: {
    foreground: '#f8f6f0',  // Ivory
    background: '#2c2c2c', // Charcoal
    contrastRatio: getContrastRatio('#f8f6f0', '#2c2c2c'),
    wcagAA: isWCAGAACompliant('#f8f6f0', '#2c2c2c'),
    wcagAAA: isWCAGAAACompliant('#f8f6f0', '#2c2c2c'),
  },
  
  goldOnCharcoal: {
    foreground: '#B8941F', // Updated gold
    background: '#2c2c2c', // Charcoal
    contrastRatio: getContrastRatio('#B8941F', '#2c2c2c'),
    wcagAA: isWCAGAACompliant('#B8941F', '#2c2c2c'),
    wcagAAA: isWCAGAAACompliant('#B8941F', '#2c2c2c'),
  },
  
  warmGrayOnIvory: {
    foreground: '#6b7280', // Warm gray
    background: '#f8f6f0',  // Ivory
    contrastRatio: getContrastRatio('#6b7280', '#f8f6f0'),
    wcagAA: isWCAGAACompliant('#6b7280', '#f8f6f0'),
    wcagAAA: isWCAGAAACompliant('#6b7280', '#f8f6f0'),
  },
};

// Function to run all accessibility tests
export function runLuxuryAccessibilityTests(): void {
  console.log('🎨 Luxury Design Token Accessibility Report');
  console.log('==========================================');
  
  Object.entries(luxuryColorAccessibilityTests).forEach(([testName, result]) => {
    console.log(`\n${testName}:`);
    console.log(`  Foreground: ${result.foreground}`);
    console.log(`  Background: ${result.background}`);
    console.log(`  Contrast Ratio: ${result.contrastRatio.toFixed(2)}:1`);
    console.log(`  WCAG AA (4.5:1): ${result.wcagAA ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  WCAG AAA (7:1): ${result.wcagAAA ? '✅ PASS' : '❌ FAIL'}`);
  });
  
  const allAACompliant = Object.values(luxuryColorAccessibilityTests).every(test => test.wcagAA);
  const allAAACompliant = Object.values(luxuryColorAccessibilityTests).every(test => test.wcagAAA);
  
  console.log('\n==========================================');
  console.log(`Overall WCAG AA Compliance: ${allAACompliant ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Overall WCAG AAA Compliance: ${allAAACompliant ? '✅ PASS' : '❌ FAIL'}`);
}

// Export for use in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).runLuxuryAccessibilityTests = runLuxuryAccessibilityTests;
}
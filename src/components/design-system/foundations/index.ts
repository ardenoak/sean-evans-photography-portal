/**
 * Luxury Design System Foundations
 * 
 * Central export for all design system foundations including tokens and variants
 */

export { luxuryTokens, getColorToken, getSpacingToken, getTypographyToken } from './tokens';
export { luxuryVariants, buttonVariants, cardVariants, textVariants, inputVariants } from './variants';

export type { 
  LuxuryColors, 
  LuxurySpacing, 
  LuxuryTypography, 
  LuxuryShadows, 
  LuxuryBorderRadius, 
  LuxuryTransitions,
} from './tokens';

export type { 
  ButtonVariant,
  CardVariant,
  TextVariant,
  InputVariant,
} from './variants';
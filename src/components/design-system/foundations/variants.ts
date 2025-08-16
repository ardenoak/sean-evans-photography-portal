/**
 * Luxury Component Variants
 * 
 * Predefined styling variants for consistent luxury component design
 * Supporting sophisticated interface patterns
 */

import { luxuryTokens } from './tokens';

// Button variants for luxury interface
export const buttonVariants = {
  primary: {
    background: luxuryTokens.colors.gold.DEFAULT,
    color: luxuryTokens.colors.charcoal.DEFAULT,
    border: `1px solid ${luxuryTokens.colors.gold.DEFAULT}`,
    fontFamily: luxuryTokens.typography.fontFamily.luxurySans,
    fontSize: luxuryTokens.typography.fontSize.luxuryBase,
    fontWeight: '500',
    padding: `${luxuryTokens.spacing.luxurySm} ${luxuryTokens.spacing.luxuryLg}`,
    borderRadius: luxuryTokens.borderRadius.luxuryMd,
    boxShadow: luxuryTokens.shadows.luxurySm,
    transition: luxuryTokens.transitions.luxury,
    '&:hover': {
      background: luxuryTokens.colors.gold.light,
      boxShadow: luxuryTokens.shadows.luxuryMd,
    },
    '&:active': {
      background: luxuryTokens.colors.gold.dark,
    },
    '&:disabled': {
      background: luxuryTokens.colors.warmGray.light,
      color: luxuryTokens.colors.warmGray.dark,
      cursor: 'not-allowed',
    },
  },
  
  secondary: {
    background: 'transparent',
    color: luxuryTokens.colors.charcoal.DEFAULT,
    border: `1px solid ${luxuryTokens.colors.charcoal.light}`,
    fontFamily: luxuryTokens.typography.fontFamily.luxurySans,
    fontSize: luxuryTokens.typography.fontSize.luxuryBase,
    fontWeight: '500',
    padding: `${luxuryTokens.spacing.luxurySm} ${luxuryTokens.spacing.luxuryLg}`,
    borderRadius: luxuryTokens.borderRadius.luxuryMd,
    transition: luxuryTokens.transitions.luxury,
    '&:hover': {
      background: luxuryTokens.colors.charcoal.light,
      color: luxuryTokens.colors.ivory.DEFAULT,
    },
    '&:active': {
      background: luxuryTokens.colors.charcoal.DEFAULT,
    },
    '&:disabled': {
      color: luxuryTokens.colors.warmGray.light,
      borderColor: luxuryTokens.colors.warmGray.light,
      cursor: 'not-allowed',
    },
  },
  
  accent: {
    background: luxuryTokens.colors.verde.DEFAULT,
    color: luxuryTokens.colors.ivory.DEFAULT,
    border: `1px solid ${luxuryTokens.colors.verde.DEFAULT}`,
    fontFamily: luxuryTokens.typography.fontFamily.luxurySans,
    fontSize: luxuryTokens.typography.fontSize.luxuryBase,
    fontWeight: '500',
    padding: `${luxuryTokens.spacing.luxurySm} ${luxuryTokens.spacing.luxuryLg}`,
    borderRadius: luxuryTokens.borderRadius.luxuryMd,
    boxShadow: luxuryTokens.shadows.luxurySm,
    transition: luxuryTokens.transitions.luxury,
    '&:hover': {
      background: luxuryTokens.colors.verde.light,
      boxShadow: luxuryTokens.shadows.luxuryMd,
    },
    '&:active': {
      background: luxuryTokens.colors.verde.dark,
    },
    '&:disabled': {
      background: luxuryTokens.colors.warmGray.light,
      color: luxuryTokens.colors.warmGray.dark,
      cursor: 'not-allowed',
    },
  },
} as const;

// Card variants for luxury interface
export const cardVariants = {
  elevated: {
    background: luxuryTokens.colors.ivory.DEFAULT,
    border: `1px solid ${luxuryTokens.colors.ivory.cool}`,
    borderRadius: luxuryTokens.borderRadius.luxuryLg,
    boxShadow: luxuryTokens.shadows.luxuryMd,
    padding: luxuryTokens.spacing.luxuryLg,
    transition: luxuryTokens.transitions.luxury,
    '&:hover': {
      boxShadow: luxuryTokens.shadows.luxuryLg,
    },
  },
  
  flat: {
    background: luxuryTokens.colors.ivory.warm,
    border: `1px solid ${luxuryTokens.colors.warmGray.light}`,
    borderRadius: luxuryTokens.borderRadius.luxuryMd,
    padding: luxuryTokens.spacing.luxuryMd,
    transition: luxuryTokens.transitions.luxury,
    '&:hover': {
      borderColor: luxuryTokens.colors.gold.light,
    },
  },
  
  premium: {
    background: `linear-gradient(135deg, ${luxuryTokens.colors.ivory.DEFAULT} 0%, ${luxuryTokens.colors.ivory.warm} 100%)`,
    border: `1px solid ${luxuryTokens.colors.gold.light}`,
    borderRadius: luxuryTokens.borderRadius.luxuryXl,
    boxShadow: luxuryTokens.shadows.luxuryLg,
    padding: luxuryTokens.spacing.luxuryXl,
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `linear-gradient(135deg, ${luxuryTokens.colors.gold.DEFAULT}15 0%, transparent 50%)`,
      borderRadius: luxuryTokens.borderRadius.luxuryXl,
      pointerEvents: 'none',
    },
  },
} as const;

// Text variants for luxury typography
export const textVariants = {
  heading: {
    primary: {
      fontFamily: luxuryTokens.typography.fontFamily.luxurySerif,
      fontSize: luxuryTokens.typography.fontSize.luxury3xl,
      lineHeight: luxuryTokens.typography.lineHeight.luxuryTight,
      color: luxuryTokens.colors.charcoal.DEFAULT,
      fontWeight: '400',
    },
    secondary: {
      fontFamily: luxuryTokens.typography.fontFamily.luxurySerif,
      fontSize: luxuryTokens.typography.fontSize.luxury2xl,
      lineHeight: luxuryTokens.typography.lineHeight.luxurySnug,
      color: luxuryTokens.colors.charcoal.light,
      fontWeight: '400',
    },
  },
  
  body: {
    primary: {
      fontFamily: luxuryTokens.typography.fontFamily.luxurySans,
      fontSize: luxuryTokens.typography.fontSize.luxuryBase,
      lineHeight: luxuryTokens.typography.lineHeight.luxuryNormal,
      color: luxuryTokens.colors.charcoal.DEFAULT,
      fontWeight: '400',
    },
    secondary: {
      fontFamily: luxuryTokens.typography.fontFamily.luxurySans,
      fontSize: luxuryTokens.typography.fontSize.luxurySm,
      lineHeight: luxuryTokens.typography.lineHeight.luxuryNormal,
      color: luxuryTokens.colors.warmGray.DEFAULT,
      fontWeight: '400',
    },
  },
  
  accent: {
    gold: {
      fontFamily: luxuryTokens.typography.fontFamily.luxurySans,
      fontSize: luxuryTokens.typography.fontSize.luxuryBase,
      lineHeight: luxuryTokens.typography.lineHeight.luxuryNormal,
      color: luxuryTokens.colors.gold.DEFAULT,
      fontWeight: '500',
    },
    verde: {
      fontFamily: luxuryTokens.typography.fontFamily.luxurySans,
      fontSize: luxuryTokens.typography.fontSize.luxuryBase,
      lineHeight: luxuryTokens.typography.lineHeight.luxuryNormal,
      color: luxuryTokens.colors.verde.DEFAULT,
      fontWeight: '500',
    },
  },
} as const;

// Input variants for luxury forms
export const inputVariants = {
  default: {
    background: luxuryTokens.colors.ivory.DEFAULT,
    border: `1px solid ${luxuryTokens.colors.warmGray.light}`,
    borderRadius: luxuryTokens.borderRadius.luxuryMd,
    padding: `${luxuryTokens.spacing.luxurySm} ${luxuryTokens.spacing.luxuryMd}`,
    fontFamily: luxuryTokens.typography.fontFamily.luxurySans,
    fontSize: luxuryTokens.typography.fontSize.luxuryBase,
    color: luxuryTokens.colors.charcoal.DEFAULT,
    transition: luxuryTokens.transitions.luxury,
    '&:focus': {
      outline: 'none',
      borderColor: luxuryTokens.colors.gold.DEFAULT,
      boxShadow: `0 0 0 3px ${luxuryTokens.colors.gold.DEFAULT}20`,
    },
    '&::placeholder': {
      color: luxuryTokens.colors.warmGray.DEFAULT,
    },
  },
  
  luxury: {
    background: luxuryTokens.colors.ivory.warm,
    border: `1px solid ${luxuryTokens.colors.gold.light}`,
    borderRadius: luxuryTokens.borderRadius.luxuryLg,
    padding: `${luxuryTokens.spacing.luxuryMd} ${luxuryTokens.spacing.luxuryLg}`,
    fontFamily: luxuryTokens.typography.fontFamily.luxurySans,
    fontSize: luxuryTokens.typography.fontSize.luxuryLg,
    color: luxuryTokens.colors.charcoal.DEFAULT,
    boxShadow: luxuryTokens.shadows.luxurySm,
    transition: luxuryTokens.transitions.luxury,
    '&:focus': {
      outline: 'none',
      borderColor: luxuryTokens.colors.gold.DEFAULT,
      boxShadow: `${luxuryTokens.shadows.luxuryMd}, 0 0 0 3px ${luxuryTokens.colors.gold.DEFAULT}20`,
    },
    '&::placeholder': {
      color: luxuryTokens.colors.warmGray.DEFAULT,
      fontStyle: 'italic',
    },
  },
} as const;

// Export all variants
export const luxuryVariants = {
  button: buttonVariants,
  card: cardVariants,
  text: textVariants,
  input: inputVariants,
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type CardVariant = keyof typeof cardVariants;
export type TextVariant = keyof typeof textVariants;
export type InputVariant = keyof typeof inputVariants;
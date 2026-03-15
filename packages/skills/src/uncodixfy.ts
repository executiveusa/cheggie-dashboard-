import { z } from 'zod';

export interface DesignToken {
  name: string;
  value: string;
  category: 'color' | 'spacing' | 'typography' | 'shadow' | 'radius';
}

export interface UncodixfyPolicy {
  allowedComponents: string[];
  allowedTokens: DesignToken[];
  forbiddenPatterns: RegExp[];
  requireAccessibility: boolean;
  requireResponsive: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const DEFAULT_FORBIDDEN_PATTERNS: RegExp[] = [
  /style\s*=\s*\{[^}]*color\s*:\s*['"]#(?![0-9a-fA-F]{3,6}\b)/,
  /style\s*=\s*\{[^}]*fontSize\s*:\s*\d+(?!px|rem|em)/,
  /<div\s+onClick/,
  /z-index\s*:\s*(?:9999|99999|999999)/,
];

const ALLOWED_COMPONENTS = [
  'Button', 'Input', 'Select', 'Checkbox', 'Radio', 'Switch',
  'Modal', 'Dialog', 'Drawer', 'Sheet',
  'Table', 'DataGrid',
  'Card', 'Badge', 'Avatar', 'Tag', 'Chip',
  'Alert', 'Toast', 'Notification',
  'Tabs', 'Accordion', 'Collapse',
  'Spinner', 'Skeleton', 'Progress',
  'Form', 'FormField', 'FormLabel', 'FormError',
  'Heading', 'Text', 'Link',
  'Icon', 'Image',
  'Stack', 'Grid', 'Container', 'Divider',
  'Tooltip', 'Popover',
  'DatePicker', 'TimePicker',
  'Chart', 'Metric', 'KPI',
];

const DesignTokenSchema = z.object({
  name: z.string(),
  value: z.string(),
  category: z.enum(['color', 'spacing', 'typography', 'shadow', 'radius']),
});

const UncodixfyPolicySchema = z.object({
  allowedComponents: z.array(z.string()),
  allowedTokens: z.array(DesignTokenSchema),
  forbiddenPatterns: z.array(z.instanceof(RegExp)),
  requireAccessibility: z.boolean(),
  requireResponsive: z.boolean(),
});

export class UncodixfyEnforcer {
  private policy: UncodixfyPolicy;

  constructor(policy?: Partial<UncodixfyPolicy>) {
    this.policy = {
      allowedComponents: policy?.allowedComponents ?? ALLOWED_COMPONENTS,
      allowedTokens: policy?.allowedTokens ?? [],
      forbiddenPatterns: policy?.forbiddenPatterns ?? DEFAULT_FORBIDDEN_PATTERNS,
      requireAccessibility: policy?.requireAccessibility ?? true,
      requireResponsive: policy?.requireResponsive ?? true,
    };
  }

  validate(code: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const pattern of this.policy.forbiddenPatterns) {
      if (pattern.test(code)) {
        errors.push(`Forbidden pattern detected: ${pattern.toString()}`);
      }
    }

    if (this.policy.requireAccessibility) {
      if (/<img(?![^>]*alt=)[^>]*>/i.test(code)) {
        errors.push('Images must have alt attributes for accessibility');
      }
      if (/<button(?![^>]*(aria-label|aria-labelledby|children))[^>]*\/>/i.test(code)) {
        warnings.push('Icon-only buttons should have aria-label');
      }
      if (/onClick(?![^}]*(onKeyDown|onKeyPress|role=["']button["']))/s.test(code)) {
        warnings.push('onClick handlers should be paired with keyboard event handlers');
      }
    }

    if (this.policy.requireResponsive) {
      if (/width\s*:\s*\d+px(?!\s*,\s*['"][^'"]*md:|responsive)/i.test(code)) {
        warnings.push('Fixed pixel widths may not be responsive. Consider using relative units or responsive breakpoints.');
      }
    }

    if (/console\.(log|debug|info)\s*\((?![^)]*`\[DEV\]`)/.test(code)) {
      warnings.push('Remove console.log statements or gate them behind DEV flag');
    }

    if (/dangerouslySetInnerHTML/i.test(code)) {
      errors.push('dangerouslySetInnerHTML is forbidden. Use sanitized rendering instead.');
    }

    if (/eval\s*\(/i.test(code)) {
      errors.push('eval() is forbidden for security reasons.');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateComponent(componentName: string): boolean {
    return this.policy.allowedComponents.includes(componentName);
  }

  getPolicy(): UncodixfyPolicy {
    return { ...this.policy };
  }

  static createDefault(): UncodixfyEnforcer {
    return new UncodixfyEnforcer();
  }
}

export type { ValidationResult as UncodixfyValidationResult };

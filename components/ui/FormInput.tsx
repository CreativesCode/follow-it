"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { formInputBase, formInputError, formLabelBase, formErrorBase, formHintBase } from "@/lib/utils/formStyles";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, hint, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label
          htmlFor={props.id || props.name}
          className={formLabelBase}
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          ref={ref}
          className={`
            ${error ? formInputError : formInputBase}
            ${className}
          `}
          {...props}
        />
        {error && <p className={formErrorBase}>{error}</p>}
        {hint && !error && <p className={formHintBase}>{hint}</p>}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

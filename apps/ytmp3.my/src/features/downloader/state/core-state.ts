/**
 * Core UI State Functions
 * Manages basic UI state: loading, errors, input type, button visibility
 */

import type { InputType } from './types';
import { getState, setState } from './state-manager';

/**
 * Clear error state
 */
export function clearError(): void {
  setState({ error: null });
}

/**
 * Set loading state
 * @param loading - Loading state
 */
export function setLoading(loading: boolean): void {
  setState({ isLoading: Boolean(loading) });
}

/**
 * Set submitting state to prevent suggestion interference
 * @param submitting - Submitting state
 */
export function setSubmitting(submitting: boolean): void {
  setState({ isSubmitting: Boolean(submitting) });
}

/**
 * Set error state
 * @param errorMessage - Error message to display
 */
export function setError(errorMessage: string): void {
  setState({
    error: errorMessage || 'An unknown error occurred',
    isLoading: false // Always stop loading when error occurs
  });
}

/**
 * Set input type based on user input
 * @param type - 'url' or 'keyword'
 */
export function setInputType(type: InputType): void {
  if (type !== 'url' && type !== 'keyword') {
    return;
  }
  setState({ inputType: type });
}

/**
 * Update button visibility based on input content
 * @param hasContent - Whether input has content
 */
export function updateButtonVisibility(hasContent: boolean): void {
  setState({
    showPasteButton: !hasContent,
    showClearButton: hasContent
  });
}

/**
 * Show paste button, hide clear button
 */
export function showPasteButton(): void {
  setState({
    showPasteButton: true,
    showClearButton: false
  });
}

/**
 * Show clear button, hide paste button
 */
export function showClearButton(): void {
  setState({
    showPasteButton: false,
    showClearButton: true
  });
}

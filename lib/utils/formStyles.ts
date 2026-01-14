/**
 * Clases base reutilizables para formularios
 * Tema claro (light mode) - siempre visible
 */

export const formInputBase = `
  w-full px-3 py-2
  text-gray-900 bg-white
  border border-gray-300 rounded-lg
  placeholder:text-gray-400
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
  disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed disabled:placeholder:text-gray-300
  transition-colors duration-200
`;

export const formTextareaBase = `
  w-full px-3 py-2
  text-gray-900 bg-white
  border border-gray-300 rounded-lg
  placeholder:text-gray-400
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
  disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed disabled:placeholder:text-gray-300
  transition-colors duration-200
  resize-y
`;

export const formSelectBase = `
  w-full px-3 py-2
  text-gray-900 bg-white
  border border-gray-300 rounded-lg
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
  disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
  transition-colors duration-200
`;

export const formLabelBase = `
  block text-sm font-medium text-gray-700 mb-1.5
`;

export const formErrorBase = `
  text-sm text-red-600 mt-1
`;

export const formHintBase = `
  text-sm text-gray-500 mt-1
`;

export const formInputError = `
  ${formInputBase}
  border-red-500 focus:ring-red-500 focus:border-red-500
`;

export const formTextareaError = `
  ${formTextareaBase}
  border-red-500 focus:ring-red-500 focus:border-red-500
`;

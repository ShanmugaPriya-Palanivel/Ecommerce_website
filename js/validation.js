/* Reusable validators. Each returns '' when valid or an error message. */
window.V = {
  required: (v, label) => (String(v == null ? '' : v).trim() ? '' : `${label} is required.`),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()) ? '' : 'Enter a valid email address.'),
  mobile: (v) => (/^\+?\d{10,13}$/.test(String(v).replace(/[\s-]/g, '')) ? '' : 'Enter a valid mobile number (10–13 digits, optional leading +).'),
  num(v, label, { int = false, min = 0, exclusive = false } = {}) {
    const s = String(v == null ? '' : v).trim();
    if (s === '') return `${label} is required.`;
    const n = Number(s);
    if (!Number.isFinite(n)) return `${label} must be a number.`;
    if (int && !Number.isInteger(n)) return `${label} must be a whole number.`;
    if (exclusive ? n <= min : n < min) return exclusive ? `${label} must be greater than ${min}.` : `${label} cannot be negative.`;
    if (n > 1e9) return `${label} is too large.`;
    return '';
  },
  localPath: (v) => (/^(https?:)?\/\//i.test(String(v).trim()) ? 'External URLs are not allowed. Use a local path under assets/images/.' : ''),
  /* Shows messages under fields named in errs ({fieldName: message}); returns true when all valid. */
  showErrors(form, errs) {
    form.querySelectorAll('.field-error').forEach((e) => (e.textContent = ''));
    form.querySelectorAll('.invalid').forEach((e) => e.classList.remove('invalid'));
    let first = null;
    Object.entries(errs).forEach(([k, msg]) => {
      if (!msg) return;
      const slot = form.querySelector(`[data-err="${k}"]`), el = form.elements[k];
      if (slot) slot.textContent = msg;
      if (el) { el.classList.add('invalid'); first = first || el; }
    });
    if (first) first.focus();
    return !first;
  }
};

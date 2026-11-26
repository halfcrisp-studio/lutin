// Message templates with grammatical variants, ready for the future message bank
// (not used by the interface yet: V1 has no built-in messages).
//
// Syntax inside a template:
//   {s:singular|plural}  depends on the number of signers   ("{s:j'ai|nous avons}")
//   {d:singular|plural}  depends on the number of children  ("{d:toi|vous}")
// Writing rule for the bank: avoid agreements that depend on the signer's gender
// (prefer "avoir" and the present tense), so no gender setting is needed.

export function renderTemplate(template, { signers = 1, recipients = 2 } = {}) {
  return String(template).replace(/\{([sd]):([^|{}]*)\|([^{}]*)\}/g, (_, dim, one, many) => {
    const n = dim === 's' ? signers : recipients;
    return n > 1 ? many : one;
  });
}

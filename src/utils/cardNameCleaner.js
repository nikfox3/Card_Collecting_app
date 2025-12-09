/**
 * Cleans card names by removing parenthetical suffixes and card number patterns
 * @param {string} name - The card name to clean
 * @returns {string} - The cleaned card name
 */
export const cleanCardName = (name) => {
  if (!name) return '';
  
  const cleaned = name.toString();
  
  // Remove parenthetical suffixes (e.g., "(Pokemon Center Exclusive)", "(Battle Arena Deck Exclusive)")
  let result = cleaned
    .replace(/\s*\([^)]*Exclusive[^)]*\)\s*$/i, '')  // Remove "(...Exclusive...)"
    .replace(/\s*\([^)]*Prerelease[^)]*\)\s*$/i, '')  // Remove "(...Prerelease...)"
    .replace(/\s*\([^)]*Build-A-Bear[^)]*\)\s*$/i, '') // Remove "(...Build-A-Bear...)"
    .replace(/\s*\([^)]*Workshop[^)]*\)\s*$/i, '')    // Remove "(...Workshop...)"
    .replace(/\s*\([^)]*Kit[^)]*\)\s*$/i, '')         // Remove "(...Kit...)"
    .replace(/\s*\([^)]*Deck[^)]*\)\s*$/i, '')        // Remove "(...Deck...)"
    .replace(/\s*\([^)]*Special[^)]*\)\s*$/i, '')      // Remove "(...Special...)"
    .replace(/\s*\([^)]*Promo[^)]*\)\s*$/i, '')       // Remove "(...Promo...)"
    .replace(/\s*\([^)]*Edition[^)]*\)\s*$/i, '')      // Remove "(...Edition...)"
    .replace(/\s*\([^)]*Variant[^)]*\)\s*$/i, '')     // Remove "(...Variant...)"
    .replace(/\s*\([^)]*Version[^)]*\)\s*$/i, '');    // Remove "(...Version...)"
  
  // Remove card number suffixes (e.g., "086", "086/165", "- 086")
  result = result
    .replace(/\s*-\s*\d+\/?\d*\s*$/, '')    // Remove "- 086" or "- 086/165"
    .replace(/\s+\d+\/?\d*\s*$/, '')        // Remove trailing " 086" or " 086/165"
    .replace(/\s*\(\d+\)\s*$/, '')          // Remove "(086)"
    .trim();
  
  return result;
};













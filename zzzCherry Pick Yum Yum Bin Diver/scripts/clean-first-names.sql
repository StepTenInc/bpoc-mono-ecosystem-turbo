-- Clean first_name column to only first word
-- "Angela Pila Empirantes" → "Angela"
-- "Maureen Claire" → "Maureen"
-- "Mary-Jane" → "Mary-Jane" (hyphenated stays together)

UPDATE carpet_bomb_leads
SET first_name = CASE
  WHEN first_name IS NULL OR TRIM(first_name) = '' THEN first_name
  ELSE TRIM(SPLIT_PART(first_name, ' ', 1))
END
WHERE first_name IS NOT NULL
  AND first_name LIKE '% %';

-- Verify the changes
SELECT
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE first_name LIKE '% %') as still_have_spaces,
  COUNT(*) FILTER (WHERE first_name NOT LIKE '% %' AND first_name IS NOT NULL) as clean_single_word
FROM carpet_bomb_leads;

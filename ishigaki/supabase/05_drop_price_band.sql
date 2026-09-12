-- Ishigaki guide — drop the price_band column
--
-- A one-of-three price band looked informative and was not: it cannot say
-- whether something is worth the money, which is the only thing a friend
-- actually wants to know. Anything genuinely cheap or genuinely expensive
-- belongs in the blurb, in words.
--
-- Only needed on a project that already ran the earlier 01/03. A fresh
-- setup never creates the column.

alter table places drop column if exists price_band;

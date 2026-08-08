-- ============================================================
-- SEED: Countries reference data
-- Run in Supabase → SQL Editor → New query → Run, AFTER migration_16.sql
--
-- Populated from recent (2025/2026-estimate) figures gathered from
-- Wikipedia "Economy of X" pages, World Bank, IMF and Trading Economics,
-- current as of this write-up. GDP figures especially move year to year —
-- treat these as a reasonable starting point, not a verified/audited
-- dataset, and update directly on each country's card as better numbers
-- come in. HNWI is intentionally left blank (manual entry, as agreed).
-- Iraq has no broadly-applied VAT system, so VAT is left blank there
-- rather than guessing a number.
-- Safe to run more than once — re-running just overwrites these same
-- starting values via upsert on the country name.
-- ============================================================

insert into countries (name, capital, biggest_cities, area, population, population_growth_rate, gdp, gdp_growth_rate, gdp_ppp, gdp_ppp_growth_rate, vat)
values
  ('Mongolia', 'Ulaanbaatar', 'Ulaanbaatar (~1.6M), Erdenet, Darkhan', 1564110, 3556798, 1.5, 25110000000, 5.5, 73280000000, 5.5, 10),
  ('Kazakhstan', 'Astana', 'Almaty (~2.0M), Astana, Shymkent', 2724900, 20590000, 1.3, 360456000000, 5.6, 993672000000, 5.0, 12),
  ('Uzbekistan', 'Tashkent', 'Tashkent (~3.0M), Samarkand, Namangan', 447400, 38236704, 1.5, 181500000000, 6.0, 552160000000, 6.0, 12),
  ('Kyrgyzstan', 'Bishkek', 'Bishkek (~1.1M), Osh, Jalal-Abad', 199951, 7300000, 1.8, 21560000000, 8.6, 68690000000, 8.6, 12),
  ('Turkmenistan', 'Ashgabat', 'Ashgabat (~1.0M), Turkmenabat, Dashoguz', 491210, 7500000, 1.5, 76890000000, 2.3, 158970000000, 2.3, 15),
  ('Tajikistan', 'Dushanbe', 'Dushanbe (~1.0M), Khujand, Kulob', 141400, 10500000, 2.5, 18780000000, 8.0, 62650000000, 8.0, 15),
  ('Georgia', 'Tbilisi', 'Tbilisi (~1.2M), Batumi, Kutaisi', 69700, 3941000, -0.3, 38100000000, 7.5, 113580000000, 7.5, 18),
  ('Armenia', 'Yerevan', 'Yerevan (~1.1M), Gyumri, Vanadzor', 29743, 3062000, 0.2, 31873000000, 5.3, 82743000000, 5.3, 20),
  ('Azerbaijan', 'Baku', 'Baku (~2.3M), Ganja, Sumqayit', 86600, 10153958, 0.8, 78370000000, 2.5, 281300000000, 2.5, 18),
  ('Pakistan', 'Islamabad', 'Karachi (~16M), Lahore, Faisalabad', 881913, 257390405, 1.9, 452100000000, 3.7, 2166000000000, 3.7, 18),
  ('Iraq', 'Baghdad', 'Baghdad (~7.2M), Basra, Mosul', 438317, 46418421, 2.3, 515020000000, 0.5, 990902000000, 0.5, null),
  ('Jordan', 'Amman', 'Amman (~4.0M), Zarqa, Irbid', 89342, 11500000, 1.0, 64910000000, 2.9, 153650000000, 2.9, 16)
on conflict (name) do update set
  capital = excluded.capital,
  biggest_cities = excluded.biggest_cities,
  area = excluded.area,
  population = excluded.population,
  population_growth_rate = excluded.population_growth_rate,
  gdp = excluded.gdp,
  gdp_growth_rate = excluded.gdp_growth_rate,
  gdp_ppp = excluded.gdp_ppp,
  gdp_ppp_growth_rate = excluded.gdp_ppp_growth_rate,
  vat = excluded.vat,
  updated_at = now();

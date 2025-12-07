-- Add ability columns to character_skins table
ALTER TABLE public.character_skins
ADD COLUMN speed_bonus integer NOT NULL DEFAULT 0,
ADD COLUMN coin_multiplier numeric(3,2) NOT NULL DEFAULT 1.00,
ADD COLUMN jump_power_bonus integer NOT NULL DEFAULT 0,
ADD COLUMN shield_duration_bonus integer NOT NULL DEFAULT 0;

-- Update existing skins with unique abilities
UPDATE public.character_skins SET speed_bonus = 0, coin_multiplier = 1.00, jump_power_bonus = 0, shield_duration_bonus = 0 WHERE id = 'default';
UPDATE public.character_skins SET speed_bonus = 10, coin_multiplier = 1.10, jump_power_bonus = 5, shield_duration_bonus = 10 WHERE id = 'ninja';
UPDATE public.character_skins SET speed_bonus = 5, coin_multiplier = 1.25, jump_power_bonus = 10, shield_duration_bonus = 5 WHERE id = 'robot';
UPDATE public.character_skins SET speed_bonus = 15, coin_multiplier = 1.05, jump_power_bonus = 8, shield_duration_bonus = 15 WHERE id = 'wizard';
UPDATE public.character_skins SET speed_bonus = 20, coin_multiplier = 1.50, jump_power_bonus = 15, shield_duration_bonus = 20 WHERE id = 'golden';
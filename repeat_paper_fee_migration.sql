-- Ensure repeat_paper_fee column exists in fees table (for settings)
ALTER TABLE fees ADD COLUMN IF NOT EXISTS repeat_paper_fee NUMERIC DEFAULT 0;

-- Ensure repeat_paper_fee column exists in feeSubmission table (for records)
-- Even though we store details in fee_type JSONB, having a column can be useful for direct queries.
ALTER TABLE "feeSubmission" ADD COLUMN IF NOT EXISTS repeat_paper_fee BOOLEAN DEFAULT false;

-- Update existing records to ensure fee_type JSONB has the key if needed
UPDATE "feeSubmission" 
SET fee_type = fee_type::jsonb || '{"repeat_paper_fee": false}'::jsonb 
WHERE (fee_type::jsonb->>'repeat_paper_fee') IS NULL;

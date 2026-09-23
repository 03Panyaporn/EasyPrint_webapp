-- Backfill is_duplex ของตัวเลือก "รูปแบบการพิมพ์" (printing_side) ที่ถูกบันทึกผ่าน Service Builder Wizard ก่อนแก้บั๊ก
-- (Wizard เดิมไม่ได้ส่ง isDuplex ไปด้วย ทุกค่าจึงกลายเป็น false → "พิมพ์ 2 ด้าน" ไม่ถูกนับเป็นแผ่นตอนคิดราคา)
-- ตั้ง true ให้เฉพาะหัวข้อ printing_side ที่ยังไม่มีค่า duplex เลย และมีชื่อค่าที่ตรงแบบ "2 ด้าน/สองหน้า/หน้าหลัง" แค่ 1 ค่าเท่านั้น
-- (กฎ Zod: ภายในหัวข้อเดียวกันมี isDuplex=true ได้ไม่เกิน 1 ค่า — หัวข้อที่กำกวมปล่อยให้ร้านตั้งเองในหน้าแก้ไขบริการ)
WITH candidates AS (
  SELECT v.id, v.option_id
  FROM "service_option_values" v
  JOIN "service_options" o ON o.id = v.option_id
  WHERE o.price_category = 'printing_side'
    AND (v.name LIKE '%2 ด้าน%' OR v.name LIKE '%สองหน้า%' OR v.name LIKE '%สองด้าน%' OR v.name LIKE '%หน้าหลัง%' OR v.name ILIKE '%duplex%')
    AND NOT EXISTS (
      SELECT 1 FROM "service_option_values" d WHERE d.option_id = v.option_id AND d.is_duplex = true
    )
),
single_candidate AS (
  SELECT option_id FROM candidates GROUP BY option_id HAVING count(*) = 1
)
UPDATE "service_option_values" v
SET "is_duplex" = true
FROM candidates c
JOIN single_candidate s ON s.option_id = c.option_id
WHERE v.id = c.id;

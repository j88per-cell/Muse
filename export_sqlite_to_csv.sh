#!/bin/bash

DB="/var/home/spike/Projects/muse/database/database.sqlite"
OUT_DIR="/var/home/spike/Projects/muse/database/csv_export"

mkdir -p "$OUT_DIR"

TABLES="books chapters characters book_character notes chapter_annotations"

for table in $TABLES; do
  echo "Exporting $table..."
  sqlite3 -header -csv "$DB" "SELECT * FROM $table;" > "$OUT_DIR/$table.csv"
done

echo "Done. CSVs written to $OUT_DIR/"

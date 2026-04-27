#!/bin/bash

BACKUP_DIR="/home/ubuntu/db_backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="postgres" 
DB_USER="postgres"

mkdir -p $BACKUP_DIR

TARGET_POD="guestbook-db-1"

echo "--- Starting Backup from $TARGET_POD ---"

kubectl exec $TARGET_POD -- pg_dumpall -U $DB_USER > $BACKUP_DIR/full_backup_$TIMESTAMP.sql

if [ $? -eq 0 ]; then
    echo "Done! Backup saved at: $BACKUP_DIR/full_backup_$TIMESTAMP.sql"
    ls -lh $BACKUP_DIR/full_backup_$TIMESTAMP.sql
else
    echo "Error: Backup failed!"
fi
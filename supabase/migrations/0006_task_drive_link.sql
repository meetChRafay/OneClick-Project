-- Lets a task carry its own Google Drive link (e.g. one video per task in a
-- video-editing project), separate from the one Drive folder link a whole
-- project can have (projects.drive_folder_url, added earlier).
alter table tasks add column drive_url text;

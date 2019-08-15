CREATE TABLE memories (
  id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  memory_title TEXT,
  memory_date DATE DEFAULT now() NOT NULL,
  memory_desc TEXT NOT NULL,
  media_url TEXT,
  familymember_id INTEGER
    REFERENCES family_members(id) ON DELETE CASCADE NOT NULL,
  date_updated TIMESTAMPTZ DEFAULT now() NOT NULL
);
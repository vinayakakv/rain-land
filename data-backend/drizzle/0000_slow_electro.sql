CREATE TABLE "raw_messages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "raw_messages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"sender_id" varchar(128) NOT NULL,
	"text" varchar(2000) NOT NULL,
	"timestamp" timestamp NOT NULL
);

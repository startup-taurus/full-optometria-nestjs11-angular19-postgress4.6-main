--
-- PostgreSQL database dump
--


-- Dumped from database version 17.7
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.stock_movements DROP CONSTRAINT IF EXISTS fk_stock_movements_product;
ALTER TABLE IF EXISTS ONLY public.stock_movements DROP CONSTRAINT IF EXISTS fk_stock_movements_created_by;
ALTER TABLE IF EXISTS ONLY public.stock_movements DROP CONSTRAINT IF EXISTS fk_stock_movements_branch;
ALTER TABLE IF EXISTS ONLY public.inventory_transfers DROP CONSTRAINT IF EXISTS fk_inventory_transfers_target_product;
ALTER TABLE IF EXISTS ONLY public.inventory_transfers DROP CONSTRAINT IF EXISTS fk_inventory_transfers_target_branch;
ALTER TABLE IF EXISTS ONLY public.inventory_transfers DROP CONSTRAINT IF EXISTS fk_inventory_transfers_source_product;
ALTER TABLE IF EXISTS ONLY public.inventory_transfers DROP CONSTRAINT IF EXISTS fk_inventory_transfers_source_branch;
ALTER TABLE IF EXISTS ONLY public.inventory_transfers DROP CONSTRAINT IF EXISTS fk_inventory_transfers_created_by;
ALTER TABLE IF EXISTS ONLY public.purchase_orders DROP CONSTRAINT IF EXISTS "FK_purchase_orders_laboratory_order_id";
ALTER TABLE IF EXISTS ONLY public.purchase_orders DROP CONSTRAINT IF EXISTS "FK_purchase_orders_company_id";
ALTER TABLE IF EXISTS ONLY public.purchase_orders DROP CONSTRAINT IF EXISTS "FK_purchase_orders_client_id";
ALTER TABLE IF EXISTS ONLY public.purchase_orders DROP CONSTRAINT IF EXISTS "FK_purchase_orders_branch_id";
ALTER TABLE IF EXISTS ONLY public.purchase_order_items DROP CONSTRAINT IF EXISTS "FK_purchase_order_items_purchase_order_id";
ALTER TABLE IF EXISTS ONLY public.product_discount DROP CONSTRAINT IF EXISTS "FK_product_discount_product";
ALTER TABLE IF EXISTS ONLY public.product_discount DROP CONSTRAINT IF EXISTS "FK_product_discount_company";
ALTER TABLE IF EXISTS ONLY public.product_discount DROP CONSTRAINT IF EXISTS "FK_product_discount_branch";
ALTER TABLE IF EXISTS ONLY public.product_audit_log DROP CONSTRAINT IF EXISTS "FK_product_audit_log_product";
ALTER TABLE IF EXISTS ONLY public.laboratory_orders DROP CONSTRAINT IF EXISTS "FK_laboratory_orders_client_id";
ALTER TABLE IF EXISTS ONLY public.laboratory_orders DROP CONSTRAINT IF EXISTS "FK_fb2a10f94d1ac9600e76b910b0d";
ALTER TABLE IF EXISTS ONLY public.subcategories DROP CONSTRAINT IF EXISTS "FK_f7b015bc580ae5179ba5a4f42ec";
ALTER TABLE IF EXISTS ONLY public.shifts DROP CONSTRAINT IF EXISTS "FK_e155f8dd2a50f91604c8d946369";
ALTER TABLE IF EXISTS ONLY public.shifts DROP CONSTRAINT IF EXISTS "FK_dfcdd9987957c59812b920027e6";
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS "FK_de720484cb95d8752861e507921";
ALTER TABLE IF EXISTS ONLY public.role_modules DROP CONSTRAINT IF EXISTS "FK_d94c957204d1c78e702a97cc1a9";
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS "FK_d4131ec6fde82732ee2f3a777cd";
ALTER TABLE IF EXISTS ONLY public.clients DROP CONSTRAINT IF EXISTS "FK_clients_patient_id";
ALTER TABLE IF EXISTS ONLY public.clients DROP CONSTRAINT IF EXISTS "FK_clients_company_id";
ALTER TABLE IF EXISTS ONLY public.clients DROP CONSTRAINT IF EXISTS "FK_clients_branch_id";
ALTER TABLE IF EXISTS ONLY public.client_patients DROP CONSTRAINT IF EXISTS "FK_client_patients_patient_id";
ALTER TABLE IF EXISTS ONLY public.client_patients DROP CONSTRAINT IF EXISTS "FK_client_patients_client_id";
ALTER TABLE IF EXISTS ONLY public.suppliers DROP CONSTRAINT IF EXISTS "FK_ce35fd787e09aecdb311aaff66c";
ALTER TABLE IF EXISTS ONLY public.shifts DROP CONSTRAINT IF EXISTS "FK_cddc0af590dd113d6e5b6b530c8";
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS "FK_c9de3a8edea9269ca774c919b9a";
ALTER TABLE IF EXISTS ONLY public.patients DROP CONSTRAINT IF EXISTS "FK_c4fc1b1cd80e7c55d359dd78137";
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS "FK_b417f1726f6ccafb18730adffb0";
ALTER TABLE IF EXISTS ONLY public.clinical_histories DROP CONSTRAINT IF EXISTS "FK_b130332f65c0d02b75e3399b9c8";
ALTER TABLE IF EXISTS ONLY public.clinical_histories DROP CONSTRAINT IF EXISTS "FK_ab8c059582f2e2d67a8af7a8612";
ALTER TABLE IF EXISTS ONLY public.companies DROP CONSTRAINT IF EXISTS "FK_a3dbf2085cb73fb94ddf2106ad4";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS "FK_a2cecd1a3531c0b041e29ba46e1";
ALTER TABLE IF EXISTS ONLY public.laboratory_orders DROP CONSTRAINT IF EXISTS "FK_a1206f47307aaebf2354974f9f8";
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS "FK_9a5f6868c96e0069e699f33e124";
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS "FK_987f987126a3f2e4f9ec03db04e";
ALTER TABLE IF EXISTS ONLY public.patients DROP CONSTRAINT IF EXISTS "FK_97d50f26dd5764039a2cbf2c30b";
ALTER TABLE IF EXISTS ONLY public.laboratory_orders DROP CONSTRAINT IF EXISTS "FK_83bea396b44568c907b291c3eb3";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS "FK_7ae6334059289559722437bcc1c";
ALTER TABLE IF EXISTS ONLY public.permissions DROP CONSTRAINT IF EXISTS "FK_738f46bb9ac6ea356f1915835d0";
ALTER TABLE IF EXISTS ONLY public.suppliers DROP CONSTRAINT IF EXISTS "FK_6a9681499416e80c1ffac4fe86c";
ALTER TABLE IF EXISTS ONLY public.clinical_histories DROP CONSTRAINT IF EXISTS "FK_6a3fafa99b3f9c1e8aa7d5157a1";
ALTER TABLE IF EXISTS ONLY public.subcategories DROP CONSTRAINT IF EXISTS "FK_644a62f955dc1ffc058e16ed838";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS "FK_5a58f726a41264c8b3e86d4a1de";
ALTER TABLE IF EXISTS ONLY public.branches DROP CONSTRAINT IF EXISTS "FK_5973f79e64a27c506b07cd84b29";
ALTER TABLE IF EXISTS ONLY public.laboratory_orders DROP CONSTRAINT IF EXISTS "FK_4fce6f548e7f997d20ce5f5274f";
ALTER TABLE IF EXISTS ONLY public.laboratory_orders DROP CONSTRAINT IF EXISTS "FK_4bccf5d81c7bd9ca9a8b8ea7193";
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS "FK_4bc1204a05dde26383e3955b0a1";
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS "FK_3f105c75bd8de6544588ec76593";
ALTER TABLE IF EXISTS ONLY public.subcategories DROP CONSTRAINT IF EXISTS "FK_3cd708752bf25e44862ccf4a61d";
ALTER TABLE IF EXISTS ONLY public.shifts DROP CONSTRAINT IF EXISTS "FK_2c6e91d710e159b564af1a2d01b";
ALTER TABLE IF EXISTS ONLY public.clinical_form_configs DROP CONSTRAINT IF EXISTS "FK_2a4d50a7164d3e7b1f7831ed6f7";
ALTER TABLE IF EXISTS ONLY public.clinical_form_configs DROP CONSTRAINT IF EXISTS "FK_29cd30f736e15404c03cb9d4b40";
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS "FK_178199805b901ccd220ab7740ec";
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS "FK_17022daf3f885f7d35423e9971e";
ALTER TABLE IF EXISTS ONLY public.role_modules DROP CONSTRAINT IF EXISTS "FK_037d3081ebb1e33fa2b4204e057";
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS "FK_0011937b9b4cd88d39accdd6edf";
DROP INDEX IF EXISTS public.ux_products_branch_code;
DROP INDEX IF EXISTS public.idx_stock_movements_type;
DROP INDEX IF EXISTS public.idx_stock_movements_reference;
DROP INDEX IF EXISTS public.idx_stock_movements_product;
DROP INDEX IF EXISTS public.idx_stock_movements_created_at;
DROP INDEX IF EXISTS public.idx_stock_movements_company;
DROP INDEX IF EXISTS public.idx_stock_movements_branch;
DROP INDEX IF EXISTS public.idx_inventory_transfers_target_product;
DROP INDEX IF EXISTS public.idx_inventory_transfers_target_branch;
DROP INDEX IF EXISTS public.idx_inventory_transfers_source_product;
DROP INDEX IF EXISTS public.idx_inventory_transfers_source_branch;
DROP INDEX IF EXISTS public.idx_inventory_transfers_created_at;
DROP INDEX IF EXISTS public.idx_inventory_transfers_company;
DROP INDEX IF EXISTS public."UQ_purchase_order_items_purchase_order_id_product_id";
DROP INDEX IF EXISTS public."IDX_whatsapp_sessions_user_id";
DROP INDEX IF EXISTS public."IDX_whatsapp_sessions_status";
DROP INDEX IF EXISTS public."IDX_whatsapp_sessions_company_id";
DROP INDEX IF EXISTS public."IDX_whatsapp_sessions_branch_id";
DROP INDEX IF EXISTS public."IDX_reminder_rules_company_id";
DROP INDEX IF EXISTS public."IDX_reminder_rules_branch_id";
DROP INDEX IF EXISTS public."IDX_purchase_orders_status";
DROP INDEX IF EXISTS public."IDX_purchase_orders_should_invoice";
DROP INDEX IF EXISTS public."IDX_purchase_orders_order_number";
DROP INDEX IF EXISTS public."IDX_purchase_orders_laboratory_order_id";
DROP INDEX IF EXISTS public."IDX_purchase_orders_company_id";
DROP INDEX IF EXISTS public."IDX_purchase_orders_client_id";
DROP INDEX IF EXISTS public."IDX_purchase_order_items_purchase_order_id";
DROP INDEX IF EXISTS public."IDX_purchase_order_items_product_id";
DROP INDEX IF EXISTS public."IDX_product_discount_product_id";
DROP INDEX IF EXISTS public."IDX_product_discount_product_active";
DROP INDEX IF EXISTS public."IDX_product_discount_is_active";
DROP INDEX IF EXISTS public."IDX_product_discount_company_id";
DROP INDEX IF EXISTS public."IDX_product_discount_branch_id";
DROP INDEX IF EXISTS public."IDX_product_discount_branch_active";
DROP INDEX IF EXISTS public."IDX_product_audit_log_product_branch";
DROP INDEX IF EXISTS public."IDX_product_audit_log_event_type";
DROP INDEX IF EXISTS public."IDX_product_audit_log_created_at";
DROP INDEX IF EXISTS public."IDX_patient_contact_preferences_patient_id";
DROP INDEX IF EXISTS public."IDX_patient_contact_preferences_company_id";
DROP INDEX IF EXISTS public."IDX_patient_contact_preferences_branch_id";
DROP INDEX IF EXISTS public."IDX_notification_campaigns_status";
DROP INDEX IF EXISTS public."IDX_notification_campaigns_scheduled_at";
DROP INDEX IF EXISTS public."IDX_notification_campaigns_company_id";
DROP INDEX IF EXISTS public."IDX_notification_campaigns_branch_id";
DROP INDEX IF EXISTS public."IDX_message_dispatch_logs_status";
DROP INDEX IF EXISTS public."IDX_message_dispatch_logs_scheduled_at";
DROP INDEX IF EXISTS public."IDX_message_dispatch_logs_patient_id";
DROP INDEX IF EXISTS public."IDX_message_dispatch_logs_company_id";
DROP INDEX IF EXISTS public."IDX_message_dispatch_logs_branch_id";
DROP INDEX IF EXISTS public."IDX_laboratory_orders_status";
DROP INDEX IF EXISTS public."IDX_laboratory_orders_client_id";
DROP INDEX IF EXISTS public."IDX_feedback_type";
DROP INDEX IF EXISTS public."IDX_feedback_status";
DROP INDEX IF EXISTS public."IDX_feedback_created_by_user_id";
DROP INDEX IF EXISTS public."IDX_feedback_company_id";
DROP INDEX IF EXISTS public."IDX_feedback_company_created";
DROP INDEX IF EXISTS public."IDX_feedback_branch_id";
DROP INDEX IF EXISTS public."IDX_feedback_branch_created";
DROP INDEX IF EXISTS public."IDX_fb2a10f94d1ac9600e76b910b0";
DROP INDEX IF EXISTS public."IDX_f2de6591767f9e27c5f4a17adc";
DROP INDEX IF EXISTS public."IDX_de9fd9baff94123ae2d2591fb3";
DROP INDEX IF EXISTS public."IDX_clients_patient_id";
DROP INDEX IF EXISTS public."IDX_clients_document_number_company_id";
DROP INDEX IF EXISTS public."IDX_clients_company_id";
DROP INDEX IF EXISTS public."IDX_clients_branch_id";
DROP INDEX IF EXISTS public."IDX_client_patients_patient_id";
DROP INDEX IF EXISTS public."IDX_client_patients_client_id";
DROP INDEX IF EXISTS public."IDX_c4fc1b1cd80e7c55d359dd7813";
DROP INDEX IF EXISTS public."IDX_b130332f65c0d02b75e3399b9c";
DROP INDEX IF EXISTS public."IDX_ab8c059582f2e2d67a8af7a861";
DROP INDEX IF EXISTS public."IDX_a42dda88ae3a545b268e70af7a";
DROP INDEX IF EXISTS public."IDX_9dba7bb491daa918b2934e662b";
DROP INDEX IF EXISTS public."IDX_97d50f26dd5764039a2cbf2c30";
DROP INDEX IF EXISTS public."IDX_83bea396b44568c907b291c3eb";
DROP INDEX IF EXISTS public."IDX_6a3fafa99b3f9c1e8aa7d5157a";
DROP INDEX IF EXISTS public."IDX_4bccf5d81c7bd9ca9a8b8ea719";
DROP INDEX IF EXISTS public."IDX_31df4aa83afdccf17a6ec8e4a9";
DROP INDEX IF EXISTS public."IDX_2a4d50a7164d3e7b1f7831ed6f";
DROP INDEX IF EXISTS public."IDX_29cd30f736e15404c03cb9d4b4";
ALTER TABLE IF EXISTS ONLY public.stock_movements DROP CONSTRAINT IF EXISTS stock_movements_pkey;
ALTER TABLE IF EXISTS ONLY public.inventory_transfers DROP CONSTRAINT IF EXISTS inventory_transfers_pkey;
ALTER TABLE IF EXISTS ONLY public.whatsapp_sessions DROP CONSTRAINT IF EXISTS "UQ_whatsapp_sessions_session_key";
ALTER TABLE IF EXISTS ONLY public.whatsapp_sessions DROP CONSTRAINT IF EXISTS "UQ_whatsapp_sessions_company_branch_user";
ALTER TABLE IF EXISTS ONLY public.reminder_rules DROP CONSTRAINT IF EXISTS "UQ_reminder_rules_company_branch";
ALTER TABLE IF EXISTS ONLY public.purchase_orders DROP CONSTRAINT IF EXISTS "UQ_purchase_orders_order_number";
ALTER TABLE IF EXISTS ONLY public.purchase_orders DROP CONSTRAINT IF EXISTS "UQ_purchase_orders_laboratory_order_id";
ALTER TABLE IF EXISTS ONLY public.patient_contact_preferences DROP CONSTRAINT IF EXISTS "UQ_patient_contact_preferences_scope";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS "UQ_fe0bb3f6520ee0469504521e710";
ALTER TABLE IF EXISTS ONLY public.laboratory_orders DROP CONSTRAINT IF EXISTS "UQ_f2de6591767f9e27c5f4a17adc9";
ALTER TABLE IF EXISTS ONLY public.modules DROP CONSTRAINT IF EXISTS "UQ_e10bfbd4b8f0bdc8f363ab5757d";
ALTER TABLE IF EXISTS ONLY public.branches DROP CONSTRAINT IF EXISTS "UQ_ac9b742f84958b3238d00ec8b3e";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS "UQ_97672ac88f789774dd47f7c8be3";
ALTER TABLE IF EXISTS ONLY public.companies DROP CONSTRAINT IF EXISTS "UQ_80af3e6808151c3210b4d5a2185";
ALTER TABLE IF EXISTS ONLY public.patients DROP CONSTRAINT IF EXISTS "UQ_64e2031265399f5690b0beba6a5";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS "UQ_5f6c1b67ac12a1e7eb454a48e59";
ALTER TABLE IF EXISTS ONLY public.companies DROP CONSTRAINT IF EXISTS "UQ_3dacbb3eb4f095e29372ff8e131";
ALTER TABLE IF EXISTS ONLY public.shift_status DROP CONSTRAINT IF EXISTS "UQ_0a6c37778b78276d4be6b514c62";
ALTER TABLE IF EXISTS ONLY public.branches DROP CONSTRAINT IF EXISTS "UQ_06583786d73e7325630a0278ff5";
ALTER TABLE IF EXISTS ONLY public.product_discount DROP CONSTRAINT IF EXISTS "UNQ_product_discount_product_branch";
ALTER TABLE IF EXISTS ONLY public.whatsapp_sessions DROP CONSTRAINT IF EXISTS "PK_whatsapp_sessions";
ALTER TABLE IF EXISTS ONLY public.reminder_rules DROP CONSTRAINT IF EXISTS "PK_reminder_rules";
ALTER TABLE IF EXISTS ONLY public.purchase_orders DROP CONSTRAINT IF EXISTS "PK_purchase_orders_id";
ALTER TABLE IF EXISTS ONLY public.purchase_order_items DROP CONSTRAINT IF EXISTS "PK_purchase_order_items";
ALTER TABLE IF EXISTS ONLY public.product_discount DROP CONSTRAINT IF EXISTS "PK_product_discount";
ALTER TABLE IF EXISTS ONLY public.product_audit_log DROP CONSTRAINT IF EXISTS "PK_product_audit_log";
ALTER TABLE IF EXISTS ONLY public.patient_contact_preferences DROP CONSTRAINT IF EXISTS "PK_patient_contact_preferences";
ALTER TABLE IF EXISTS ONLY public.notification_campaigns DROP CONSTRAINT IF EXISTS "PK_notification_campaigns";
ALTER TABLE IF EXISTS ONLY public.message_dispatch_logs DROP CONSTRAINT IF EXISTS "PK_message_dispatch_logs";
ALTER TABLE IF EXISTS ONLY public.feedback DROP CONSTRAINT IF EXISTS "PK_feedback";
ALTER TABLE IF EXISTS ONLY public.companies DROP CONSTRAINT IF EXISTS "PK_d4bc3e82a314fa9e29f652c2c22";
ALTER TABLE IF EXISTS ONLY public.clients DROP CONSTRAINT IF EXISTS "PK_clients_id";
ALTER TABLE IF EXISTS ONLY public.client_patients DROP CONSTRAINT IF EXISTS "PK_client_patients";
ALTER TABLE IF EXISTS ONLY public.clinical_histories DROP CONSTRAINT IF EXISTS "PK_cfb9612b30d2167eee2db3ea3d7";
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS "PK_c1433d71a4838793a49dcad46ab";
ALTER TABLE IF EXISTS ONLY public.suppliers DROP CONSTRAINT IF EXISTS "PK_b70ac51766a9e3144f778cfe81e";
ALTER TABLE IF EXISTS ONLY public.laboratory_orders DROP CONSTRAINT IF EXISTS "PK_af3dc5b9faaf79265b135b62c57";
ALTER TABLE IF EXISTS ONLY public.patients DROP CONSTRAINT IF EXISTS "PK_a7f0b9fcbb3469d5ec0b0aceaa7";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS "PK_a3ffb1c0c8416b9fc6f907b7433";
ALTER TABLE IF EXISTS ONLY public.permissions DROP CONSTRAINT IF EXISTS "PK_920331560282b8bd21bb02290df";
ALTER TABLE IF EXISTS ONLY public.migrations DROP CONSTRAINT IF EXISTS "PK_8c82d7f526340ab734260ea46be";
ALTER TABLE IF EXISTS ONLY public.shifts DROP CONSTRAINT IF EXISTS "PK_84d692e367e4d6cdf045828768c";
ALTER TABLE IF EXISTS ONLY public.branches DROP CONSTRAINT IF EXISTS "PK_7f37d3b42defea97f1df0d19535";
ALTER TABLE IF EXISTS ONLY public.modules DROP CONSTRAINT IF EXISTS "PK_7dbefd488bd96c5bf31f0ce0c95";
ALTER TABLE IF EXISTS ONLY public.subcategories DROP CONSTRAINT IF EXISTS "PK_793ef34ad0a3f86f09d4837007c";
ALTER TABLE IF EXISTS ONLY public.files DROP CONSTRAINT IF EXISTS "PK_6c16b9093a142e0e7613b04a3d9";
ALTER TABLE IF EXISTS ONLY public.clinical_form_configs DROP CONSTRAINT IF EXISTS "PK_2b869a35e7a49922535c242ab59";
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS "PK_25d24010f53bb80b78e412c9656";
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS "PK_24dbc6126a28ff948da33e97d3b";
ALTER TABLE IF EXISTS ONLY public.shift_status DROP CONSTRAINT IF EXISTS "PK_120976db1d22acde6cd67406e53";
ALTER TABLE IF EXISTS ONLY public.role_modules DROP CONSTRAINT IF EXISTS "PK_0898417a9cc2d78e322076dc86a";
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS "PK_0806c755e0aca124e67c0cf6d7d";
ALTER TABLE IF EXISTS public.migrations ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.whatsapp_sessions;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.suppliers;
DROP TABLE IF EXISTS public.subcategories;
DROP TABLE IF EXISTS public.stock_movements;
DROP TABLE IF EXISTS public.shifts;
DROP TABLE IF EXISTS public.shift_status;
DROP TABLE IF EXISTS public.roles;
DROP TABLE IF EXISTS public.role_permissions;
DROP TABLE IF EXISTS public.role_modules;
DROP TABLE IF EXISTS public.reminder_rules;
DROP TABLE IF EXISTS public.purchase_orders;
DROP TABLE IF EXISTS public.purchase_order_items;
DROP TABLE IF EXISTS public.products;
DROP TABLE IF EXISTS public.product_discount;
DROP TABLE IF EXISTS public.product_audit_log;
DROP TABLE IF EXISTS public.permissions;
DROP TABLE IF EXISTS public.patients;
DROP TABLE IF EXISTS public.patient_contact_preferences;
DROP TABLE IF EXISTS public.notification_campaigns;
DROP TABLE IF EXISTS public.modules;
DROP SEQUENCE IF EXISTS public.migrations_id_seq;
DROP TABLE IF EXISTS public.migrations;
DROP TABLE IF EXISTS public.message_dispatch_logs;
DROP TABLE IF EXISTS public.laboratory_orders;
DROP TABLE IF EXISTS public.inventory_transfers;
DROP TABLE IF EXISTS public.files;
DROP TABLE IF EXISTS public.feedback;
DROP TABLE IF EXISTS public.companies;
DROP TABLE IF EXISTS public.clinical_histories;
DROP TABLE IF EXISTS public.clinical_form_configs;
DROP TABLE IF EXISTS public.clients;
DROP TABLE IF EXISTS public.client_patients;
DROP TABLE IF EXISTS public.categories;
DROP TABLE IF EXISTS public.branches;
DROP TYPE IF EXISTS public.laboratory_orders_frame_type_enum;
DROP EXTENSION IF EXISTS "uuid-ossp";
--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: laboratory_orders_frame_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.laboratory_orders_frame_type_enum AS ENUM (
    '3_piezas_al_aire',
    'ranurado_semiaire',
    'completo'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: branches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branches (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    code character varying NOT NULL,
    address character varying NOT NULL,
    city character varying NOT NULL,
    phone character varying,
    corporate_email character varying,
    opening_hours text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    company_id uuid
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    branch_id uuid NOT NULL,
    name character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    description character varying,
    company_id uuid
);


--
-- Name: client_patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_patients (
    client_id uuid NOT NULL,
    patient_id uuid NOT NULL
);


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    email character varying NOT NULL,
    document_number character varying NOT NULL,
    patient_id uuid,
    company_id uuid,
    branch_id uuid,
    mobile_phone character varying,
    home_phone character varying,
    address text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: clinical_form_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinical_form_configs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    branch_id uuid NOT NULL,
    config_name character varying NOT NULL,
    "fieldsConfig" jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    company_id uuid
);


--
-- Name: clinical_histories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinical_histories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    branch_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    professional_name character varying,
    is_sent boolean DEFAULT false NOT NULL,
    last_visual_exam_date timestamp without time zone,
    vision_problems text,
    general_health text,
    other_health_problems text,
    segment_anterior character varying,
    previous_rx_od character varying,
    previous_add_od character varying,
    previous_rx_oi character varying,
    previous_add_oi character varying,
    visual_acuity_od_vl character varying,
    visual_acuity_od_vp character varying,
    visual_acuity_oi_vl character varying,
    visual_acuity_oi_vp character varying,
    "motorTest" jsonb,
    final_rx_od_sphere character varying,
    final_rx_od_cylinder character varying,
    final_rx_od_axis character varying,
    final_rx_od_add character varying,
    final_rx_oi_sphere character varying,
    final_rx_oi_cylinder character varying,
    final_rx_oi_axis character varying,
    final_rx_oi_add character varying,
    corrected_av_od_vl character varying,
    corrected_av_od_vp character varying,
    corrected_av_oi_vl character varying,
    corrected_av_oi_vp character varying,
    "lensTypes" jsonb,
    "pupillaryReflexes" jsonb,
    ophthalmoscopy_od text,
    ophthalmoscopy_oi text,
    "refractiveTests" jsonb,
    stereopsis character varying,
    worth_test character varying,
    other_notes text,
    diagnosis text,
    disposition text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    occupation character varying,
    first_time boolean DEFAULT false NOT NULL,
    segment_anterior_other character varying,
    "additionalTreatments" jsonb,
    company_id uuid,
    previous_od_vl character varying,
    previous_od_vp character varying,
    previous_oi_vl character varying,
    previous_oi_vp character varying,
    previous_ao character varying
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    code character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    logo_file_id uuid,
    email character varying,
    phone character varying,
    slug character varying,
    max_users integer,
    max_branches integer
);


--
-- Name: feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedback (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    branch_id uuid,
    created_by_user_id uuid NOT NULL,
    type character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'nuevo'::character varying NOT NULL,
    title character varying(180) NOT NULL,
    description text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_feedback_status" CHECK (((status)::text = ANY ((ARRAY['nuevo'::character varying, 'en_revision'::character varying, 'resuelto'::character varying])::text[]))),
    CONSTRAINT "CHK_feedback_type" CHECK (((type)::text = ANY ((ARRAY['suggestion'::character varying, 'report'::character varying])::text[])))
);


--
-- Name: files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.files (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    filename character varying NOT NULL,
    original_name character varying NOT NULL,
    path character varying NOT NULL,
    size integer NOT NULL,
    mime_type character varying NOT NULL,
    entity_type character varying NOT NULL,
    entity_id character varying NOT NULL,
    file_category character varying,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    is_cover boolean DEFAULT false NOT NULL
);


--
-- Name: inventory_transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_transfers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid,
    source_branch_id uuid NOT NULL,
    target_branch_id uuid NOT NULL,
    source_product_id uuid NOT NULL,
    target_product_id uuid NOT NULL,
    source_code character varying(50) NOT NULL,
    quantity integer NOT NULL,
    note text,
    created_by_user_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_inventory_transfers_branchs_diff CHECK ((source_branch_id <> target_branch_id)),
    CONSTRAINT chk_inventory_transfers_quantity_positive CHECK ((quantity > 0))
);


--
-- Name: laboratory_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.laboratory_orders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    branch_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    clinical_history_id uuid,
    attendance_date date,
    delivery_date date,
    od_sphere character varying,
    od_cylinder character varying,
    od_axis character varying,
    od_add character varying,
    od_height character varying,
    od_dnp character varying,
    oi_sphere character varying,
    oi_cylinder character varying,
    oi_axis character varying,
    oi_add character varying,
    oi_height character varying,
    oi_dnp character varying,
    d_vertex character varying,
    pantos character varying,
    panora character varying,
    frame_fit character varying,
    profile character varying,
    mid character varying,
    dist_vp character varying,
    engraving character varying,
    product_id uuid,
    frame_type public.laboratory_orders_frame_type_enum,
    frame_type_description character varying,
    frame_brand character varying,
    frame_model character varying,
    frame_data character varying,
    frame_larger_diameter character varying,
    frame_horizontal character varying,
    frame_vertical character varying,
    frame_bridge character varying,
    observations text,
    is_confirmed boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    order_number integer,
    cbase character varying,
    sun_degree character varying,
    prism character varying,
    base character varying,
    company_id uuid,
    product_ids uuid[],
    product_quantities jsonb,
    status character varying(20) DEFAULT 'pending'::character varying,
    client_id uuid
);


--
-- Name: message_dispatch_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_dispatch_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid,
    branch_id uuid,
    patient_id uuid NOT NULL,
    campaign_id uuid,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    channel character varying(24) NOT NULL,
    phone character varying(30) NOT NULL,
    message text NOT NULL,
    scheduled_at timestamp without time zone,
    sent_at timestamp without time zone,
    provider_message_id character varying,
    error_reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    module_name character varying NOT NULL,
    description character varying,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: notification_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_campaigns (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid,
    branch_id uuid,
    name character varying(120) NOT NULL,
    type character varying(20) DEFAULT 'reminder'::character varying NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    message_template text NOT NULL,
    scheduled_at timestamp without time zone,
    processed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: patient_contact_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_contact_preferences (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid,
    branch_id uuid,
    patient_id uuid NOT NULL,
    preferred_phone character varying,
    whatsapp_opt_in boolean DEFAULT false NOT NULL,
    promotions_opt_in boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patients (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    email character varying NOT NULL,
    document_number character varying NOT NULL,
    company_id uuid,
    branch_id uuid,
    date_of_birth timestamp without time zone,
    address character varying,
    home_phone character varying,
    mobile_phone character varying,
    profile_photo character varying,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    permission_name character varying NOT NULL,
    description character varying,
    is_active boolean DEFAULT true NOT NULL,
    module_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: product_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_audit_log (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid,
    branch_id uuid NOT NULL,
    product_id uuid NOT NULL,
    event_type character varying(30) NOT NULL,
    changed_fields jsonb,
    metadata jsonb,
    created_by_user_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: product_discount; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_discount (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    product_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    company_id uuid NOT NULL,
    discount_type character varying(20) NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_discount_type" CHECK (((discount_type)::text = ANY ((ARRAY['PERCENTAGE'::character varying, 'FIXED_AMOUNT'::character varying])::text[])))
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    branch_id uuid NOT NULL,
    code character varying NOT NULL,
    name character varying NOT NULL,
    category_id uuid NOT NULL,
    subcategory_id uuid NOT NULL,
    brand character varying NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    quantity integer NOT NULL,
    default_supplier_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    description text,
    created_by_user_id uuid,
    views integer DEFAULT 0 NOT NULL,
    company_id uuid
);


--
-- Name: purchase_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_order_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    purchase_order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    product_code character varying NOT NULL,
    product_name character varying NOT NULL,
    product_brand character varying,
    quantity integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    line_total numeric(12,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_orders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_number integer,
    client_id uuid NOT NULL,
    laboratory_order_id uuid NOT NULL,
    company_id uuid,
    branch_id uuid,
    should_invoice boolean DEFAULT false NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    total_amount numeric(12,2),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: reminder_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reminder_rules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid,
    branch_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    appointment_reminder_hours_before integer DEFAULT 24 NOT NULL,
    renewal_after_days integer DEFAULT 365 NOT NULL,
    renewal_notify_before_days integer DEFAULT 15 NOT NULL,
    quiet_hours_start character varying DEFAULT '21:00'::character varying NOT NULL,
    quiet_hours_end character varying DEFAULT '08:00'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: role_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_modules (
    role_id uuid NOT NULL,
    module_id uuid NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    role_name character varying NOT NULL,
    description character varying,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    company_id uuid
);


--
-- Name: shift_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shift_status (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    description character varying,
    color character varying,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: shifts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shifts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patient_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    status_id uuid NOT NULL,
    appointment_date timestamp without time zone NOT NULL,
    description text NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    company_id uuid
);


--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_movements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid,
    branch_id uuid NOT NULL,
    product_id uuid NOT NULL,
    movement_type character varying(50) NOT NULL,
    quantity integer NOT NULL,
    balance_after integer NOT NULL,
    reference_type character varying(50),
    reference_id uuid,
    note text,
    created_by_user_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_stock_movements_quantity_positive CHECK ((quantity > 0))
);


--
-- Name: subcategories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subcategories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    branch_id uuid NOT NULL,
    category_id uuid NOT NULL,
    name character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    description character varying,
    company_id uuid
);


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    branch_id uuid NOT NULL,
    name character varying NOT NULL,
    document_number character varying,
    phone character varying,
    email character varying,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    company_id uuid,
    website character varying(255),
    address character varying(255),
    notes text
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying NOT NULL,
    email character varying NOT NULL,
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    password_hash character varying NOT NULL,
    role_id uuid NOT NULL,
    profile_photo character varying,
    address character varying,
    document_number character varying,
    date_of_birth timestamp without time zone,
    home_phone character varying,
    mobile_phone character varying,
    is_active boolean DEFAULT true NOT NULL,
    is_locked boolean DEFAULT false NOT NULL,
    failed_login_attempts integer DEFAULT 0 NOT NULL,
    last_login_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    reset_token character varying,
    reset_token_expiry timestamp without time zone,
    branch_id uuid,
    company_id uuid
);


--
-- Name: whatsapp_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whatsapp_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid,
    branch_id uuid,
    user_id uuid,
    session_key character varying NOT NULL,
    status character varying(20) DEFAULT 'disconnected'::character varying NOT NULL,
    qr_code text,
    connected_phone character varying,
    last_connected_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.branches (id, name, code, address, city, phone, corporate_email, opening_hours, is_active, created_at, updated_at, company_id) FROM stdin;
d67dcc35-dd4a-4355-9d08-da3a19796932	Sorti-manta	1231231234	via san matheo	manta	0995923599	sorti@gmail.com	[{"day":0,"enabled":false,"startTime":"08:00","endTime":"18:00"},{"day":1,"enabled":true,"startTime":"08:00","endTime":"18:00"},{"day":2,"enabled":true,"startTime":"08:00","endTime":"18:00"},{"day":3,"enabled":true,"startTime":"08:00","endTime":"18:00"},{"day":4,"enabled":true,"startTime":"08:00","endTime":"18:00"},{"day":5,"enabled":true,"startTime":"08:00","endTime":"18:00"},{"day":6,"enabled":false,"startTime":"08:00","endTime":"18:00"}]	t	2025-11-11 17:09:09.560178	2026-03-11 09:18:58.667076	ff3f49aa-6a6f-4634-ba63-823f84d23d31
de8015dd-7b85-48a0-ab93-87be7b427ee5	dsdsds	dssdsdsd	sdsdsd	sdsdsd	0969950255	psdrincipal@gmail.com	[{"day":0,"enabled":false,"startTime":"08:00","endTime":"18:00"},{"day":1,"enabled":true,"startTime":"08:00","endTime":"18:00"},{"day":2,"enabled":true,"startTime":"08:00","endTime":"18:00"},{"day":3,"enabled":true,"startTime":"08:00","endTime":"18:00"},{"day":4,"enabled":true,"startTime":"08:00","endTime":"18:00"},{"day":5,"enabled":true,"startTime":"08:00","endTime":"15:00"},{"day":6,"enabled":false,"startTime":"08:00","endTime":"18:00"}]	t	2026-03-03 16:51:38.884367	2026-03-12 14:17:00.081829	ff3f49aa-6a6f-4634-ba63-823f84d23d31
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, branch_id, name, is_active, created_at, updated_at, description, company_id) FROM stdin;
c7577e97-ec49-4e8b-8fc0-efa6725577b4	d67dcc35-dd4a-4355-9d08-da3a19796932	Armazones	t	2026-03-02 14:48:09.437924	2026-03-02 14:48:09.437924	aqui van los armazones\n	ff3f49aa-6a6f-4634-ba63-823f84d23d31
5a76d03c-1ba1-4326-8d84-57aed3b42bdc	de8015dd-7b85-48a0-ab93-87be7b427ee5	Armazones	t	2026-03-05 16:38:57.93666	2026-03-05 16:38:57.93666	test	ff3f49aa-6a6f-4634-ba63-823f84d23d31
4d1620f3-63aa-423b-b27f-80aba96638a1	d67dcc35-dd4a-4355-9d08-da3a19796932	lunas	t	2026-03-31 17:10:46.516798	2026-03-31 17:10:46.516798	test	ff3f49aa-6a6f-4634-ba63-823f84d23d31
\.


--
-- Data for Name: client_patients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_patients (client_id, patient_id) FROM stdin;
bbb5d743-4c43-4541-9796-0b7b0cd1152c	0a6c271b-ce68-434e-87c2-59fb10e59edb
343770d0-ecfe-4d8e-93f9-d77b2e187f3f	0a6c271b-ce68-434e-87c2-59fb10e59edb
e325341b-b990-4870-a0a5-de193e4075f1	32f5a2a3-5758-4fb6-b4b6-ec55414942e7
915c3f9d-b7b4-4be1-804f-818d4fff60ff	0a6c271b-ce68-434e-87c2-59fb10e59edb
c74d74c4-05a1-4dc8-bf73-e6a5e9fa9d2a	32f5a2a3-5758-4fb6-b4b6-ec55414942e7
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clients (id, first_name, last_name, email, document_number, patient_id, company_id, branch_id, mobile_phone, home_phone, address, is_active, created_at, updated_at) FROM stdin;
bbb5d743-4c43-4541-9796-0b7b0cd1152c	marilin	lopez	marilin@gmail.com	1234857456	0a6c271b-ce68-434e-87c2-59fb10e59edb	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932				t	2026-04-02 11:18:27.925378	2026-04-02 11:18:27.925378
343770d0-ecfe-4d8e-93f9-d77b2e187f3f	chirli	mero	chirli@gmail.com	8756372324	0a6c271b-ce68-434e-87c2-59fb10e59edb	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932				t	2026-04-02 11:26:24.375025	2026-04-02 11:26:24.375025
e325341b-b990-4870-a0a5-de193e4075f1	irene	reyes	irene@gmail.com	1318017068	32f5a2a3-5758-4fb6-b4b6-ec55414942e7	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	0998411681			t	2026-04-02 11:27:56.619927	2026-04-02 11:27:56.619927
915c3f9d-b7b4-4be1-804f-818d4fff60ff	byron	calderon	byron@gmail.com	1231234567	0a6c271b-ce68-434e-87c2-59fb10e59edb	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	0959563850			t	2026-04-02 12:31:17.116173	2026-04-02 12:31:17.116173
c74d74c4-05a1-4dc8-bf73-e6a5e9fa9d2a	fabricio	zavala	fabrii@gmail.com	123123453	32f5a2a3-5758-4fb6-b4b6-ec55414942e7	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	0962766008			t	2026-04-06 16:17:29.968292	2026-04-06 16:17:29.968292
\.


--
-- Data for Name: clinical_form_configs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clinical_form_configs (id, branch_id, config_name, "fieldsConfig", is_active, version, created_at, updated_at, company_id) FROM stdin;
21a7007e-464d-4d09-be74-c5bf32f9f4dc	d67dcc35-dd4a-4355-9d08-da3a19796932	clinical_history_form	{"sections": {"step2_motorTests": {"fields": {"npa": true, "npc": true, "ductions": true, "versions": true, "coverTest": true, "stereopsis": true, "fusionalVergences": true}, "visible": true}, "step3_otherExams": {"fields": {"tonometry": true, "gonioscopy": true, "pachymetry": true, "biomicroscopy": true}, "visible": true}, "step2_keratometry": {"fields": {"keratometryOd": true, "keratometryOi": true}, "visible": true}, "step2_retinoscopy": {"fields": {"retinoscopyAxis": true, "retinoscopySphere": true, "retinoscopyCylinder": true}, "visible": true}, "step1_personalData": {"fields": {"height": true, "weight": true, "allergies": true, "occupation": true, "chiefComplaint": true, "currentMedications": true}, "visible": true}, "step3_ophthalmoscopy": {"fields": {"ophthalmoscopyOd": true, "ophthalmoscopyOi": true}, "visible": true}, "step3_refractiveTests": {"fields": {"keratometry": true, "retinoscopy": true, "autorefraction": true}, "visible": true}, "step2_visualAcuityNoRx": {"fields": {"visualAcuityOdVl": true, "visualAcuityOdVp": true, "visualAcuityOiVl": true, "visualAcuityOiVp": true}, "visible": true}, "step3_pupillaryReflexes": {"fields": {"directReflexOd": true, "directReflexOi": true, "consensualReflexOd": true, "consensualReflexOi": true}, "visible": true}, "step2_previousLensometry": {"fields": {"previousRxOd": true, "previousRxOi": true, "previousAddOd": true, "previousAddOi": true}, "visible": true}, "step2_visualAcuityWithRx": {"fields": {"correctedAvOdVl": true, "correctedAvOdVp": true, "correctedAvOiVl": true, "correctedAvOiVp": true}, "visible": true}, "step2_subjectiveRefraction": {"fields": {"subjectiveRxOdAdd": true, "subjectiveRxOiAdd": true, "subjectiveRxOdAxis": true, "subjectiveRxOiAxis": true, "subjectiveRxOdSphere": true, "subjectiveRxOiSphere": true, "subjectiveRxOdCylinder": true, "subjectiveRxOiCylinder": true}, "visible": true}, "step3_diagnosisAndDisposition": {"fields": {"followUp": true, "referral": true, "diagnosis": true, "treatment": true, "recommendations": true}, "visible": true}}}	t	1	2025-11-13 15:48:53.904843	2025-11-13 15:48:53.904843	\N
18515fd9-b197-4449-962e-9fb9cb40f90c	d67dcc35-dd4a-4355-9d08-da3a19796932	clinical_history_form	{"sections": {"step2_finalRx": {"fields": {"finalRxOdAdd": true, "finalRxOiAdd": true, "finalRxOdAvVl": true, "finalRxOdAvVp": true, "finalRxOdAxis": true, "finalRxOiAvVl": true, "finalRxOiAvVp": true, "finalRxOiAxis": true, "finalRxOdSphere": true, "finalRxOiSphere": true, "finalRxOdCylinder": true, "finalRxOiCylinder": true}, "visible": true}, "step2_lensTypes": {"fields": {"lensTypes": true}, "visible": true}, "step2_motorTest": {"fields": {"exophoria": true, "exotropia": true, "endophoria": true, "endotropia": true, "hypotropia": true, "alternating": true, "hyperphoria": true}, "visible": true}, "step2_previousRx": {"fields": {"previousAo": true, "previousOdVl": true, "previousOdVp": true, "previousOiVl": true, "previousOiVp": true, "previousRxOd": true, "previousRxOi": true, "previousAddOd": true, "previousAddOi": true}, "visible": true}, "step3_otherExams": {"fields": {"worthTest": true, "otherNotes": true, "stereopsis": true}, "visible": true}, "step1_personalData": {"fields": {"occupation": false, "generalHealth": true, "visionProblems": true, "segmentAnterior": true, "lastVisualExamDate": true, "otherHealthProblems": true}, "visible": true}, "step2_visualAcuity": {"fields": {"visualAcuityOdVl": true, "visualAcuityOdVp": true, "visualAcuityOiVl": true, "visualAcuityOiVp": true}, "visible": true}, "step3_ophthalmoscopy": {"fields": {"ophthalmoscopyOd": true, "ophthalmoscopyOi": true}, "visible": true}, "step3_refractiveTests": {"fields": {"refraction": true, "subjective": true, "autorefract": true, "keratometry": true}, "visible": true}, "step2_professionalName": {"fields": {"professionalName": true}, "visible": true}, "step3_pupillaryReflexes": {"fields": {"consensual": true, "photomotor": true, "accommodative": true}, "visible": true}, "step2_additionalTreatments": {"fields": {"additionalTreatments": true}, "visible": true}, "step3_diagnosisAndDisposition": {"fields": {"diagnosis": true, "disposition": true}, "visible": true}}}	t	5	2026-03-11 16:02:05.375117	2026-03-31 17:31:02.76129	ff3f49aa-6a6f-4634-ba63-823f84d23d31
\.


--
-- Data for Name: clinical_histories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clinical_histories (id, branch_id, patient_id, professional_name, is_sent, last_visual_exam_date, vision_problems, general_health, other_health_problems, segment_anterior, previous_rx_od, previous_add_od, previous_rx_oi, previous_add_oi, visual_acuity_od_vl, visual_acuity_od_vp, visual_acuity_oi_vl, visual_acuity_oi_vp, "motorTest", final_rx_od_sphere, final_rx_od_cylinder, final_rx_od_axis, final_rx_od_add, final_rx_oi_sphere, final_rx_oi_cylinder, final_rx_oi_axis, final_rx_oi_add, corrected_av_od_vl, corrected_av_od_vp, corrected_av_oi_vl, corrected_av_oi_vp, "lensTypes", "pupillaryReflexes", ophthalmoscopy_od, ophthalmoscopy_oi, "refractiveTests", stereopsis, worth_test, other_notes, diagnosis, disposition, created_at, updated_at, occupation, first_time, segment_anterior_other, "additionalTreatments", company_id, previous_od_vl, previous_od_vp, previous_oi_vl, previous_oi_vp, previous_ao) FROM stdin;
dbb7de2b-0e35-4e62-871a-2dd7e5b9c1a3	d67dcc35-dd4a-4355-9d08-da3a19796932	524d69f7-4784-4b78-af56-1c97223e7ef7	test	t	2025-11-16 00:00:00	test	test			test	test	test	test	test	test	test	test	{"exophoria": {"od": "test", "oi": "test", "value": "", "applies": true}, "exotropia": {"od": "", "oi": "", "value": "", "applies": ""}, "endophoria": {"od": "", "oi": "", "value": "", "applies": ""}, "endotropia": {"od": "", "oi": "", "value": "", "applies": ""}, "hypotropia": {"od": "", "oi": "", "value": "", "applies": ""}, "alternating": {"od": "", "oi": "", "value": "", "applies": ""}, "hyperphoria": {"od": "", "oi": "", "value": "", "applies": ""}}	test			test	test			test	test	test	test	test	["acomodativos u ocupacionales"]	{"consensual": {"od": "test", "oi": "test"}, "photomotor": {"od": "test", "oi": "test"}, "accommodative": {"od": "test", "oi": "test"}}	test	test	{"refraction": {"od": "test", "oi": "test"}, "subjective": {"od": "test", "oi": "test"}, "autorefract": {"od": "test", "oi": "test"}, "keratometry": {"od": "test", "oi": "test"}}	test	test	test	test	test	2025-11-17 15:44:47.848145	2026-03-02 14:25:21.475771	test de cambio en un hc desde pacientes	f		["fotocrom├ítico", "filtro de luz azul", "antireflejo"]	ff3f49aa-6a6f-4634-ba63-823f84d23d31	\N	\N	\N	\N	\N
980793ce-e9c5-4c78-b153-27ac6a3e26b5	d67dcc35-dd4a-4355-9d08-da3a19796932	3c383330-de98-4617-9b9d-b9406c92ed0b		t	\N	no ve bien	bien	no										{"exophoria": {"od": "", "oi": "", "value": "", "applies": ""}, "exotropia": {"od": "", "oi": "", "value": "", "applies": ""}, "endophoria": {"od": "", "oi": "", "value": "", "applies": ""}, "endotropia": {"od": "", "oi": "", "value": "", "applies": ""}, "hypotropia": {"od": "", "oi": "", "value": "", "applies": ""}, "alternating": {"od": "", "oi": "", "value": "", "applies": ""}, "hyperphoria": {"od": "", "oi": "", "value": "", "applies": ""}}													["monofocales"]	{"consensual": {"od": "", "oi": ""}, "photomotor": {"od": "", "oi": ""}, "accommodative": {"od": "", "oi": ""}}			{"refraction": {"od": "", "oi": ""}, "subjective": {"od": "", "oi": ""}, "autorefract": {"od": "", "oi": ""}, "keratometry": {"od": "", "oi": ""}}						2026-03-02 14:29:52.099023	2026-03-02 16:20:33.905616	desarrollador	t		["fotocrom├ítico"]	ff3f49aa-6a6f-4634-ba63-823f84d23d31	\N	\N	\N	\N	\N
4c5355b3-f83e-4c54-8ade-07dcda2e9c1b	d67dcc35-dd4a-4355-9d08-da3a19796932	524d69f7-4784-4b78-af56-1c97223e7ef7		f	\N													{"exophoria": {"od": "", "oi": "", "value": "", "applies": ""}, "exotropia": {"od": "", "oi": "", "value": "", "applies": ""}, "endophoria": {"od": "", "oi": "", "value": "", "applies": ""}, "endotropia": {"od": "", "oi": "", "value": "", "applies": ""}, "hypotropia": {"od": "", "oi": "", "value": "", "applies": ""}, "alternating": {"od": "", "oi": "", "value": "", "applies": ""}, "hyperphoria": {"od": "", "oi": "", "value": "", "applies": ""}}													[]	{"consensual": {"od": "", "oi": ""}, "photomotor": {"od": "", "oi": ""}, "accommodative": {"od": "", "oi": ""}}			{"refraction": {"od": "", "oi": ""}, "subjective": {"od": "", "oi": ""}, "autorefract": {"od": "", "oi": ""}, "keratometry": {"od": "", "oi": ""}}						2026-03-03 11:43:03.758903	2026-03-03 11:43:03.758903		f		[]	ff3f49aa-6a6f-4634-ba63-823f84d23d31	\N	\N	\N	\N	\N
df939fd8-fc3d-4af4-a522-e71a9c1351f3	d67dcc35-dd4a-4355-9d08-da3a19796932	0a6c271b-ce68-434e-87c2-59fb10e59edb		t	2026-04-01 00:00:00	ta ciego	no ve	camaron										{"exophoria": {"od": "", "oi": "", "value": "", "applies": ""}, "exotropia": {"od": "", "oi": "", "value": "", "applies": ""}, "endophoria": {"od": "", "oi": "", "value": "", "applies": ""}, "endotropia": {"od": "", "oi": "", "value": "", "applies": ""}, "hypotropia": {"od": "", "oi": "", "value": "", "applies": ""}, "alternating": {"od": "", "oi": "", "value": "", "applies": ""}, "hyperphoria": {"od": "", "oi": "", "value": "", "applies": ""}}													[]	{"consensual": {"od": "", "oi": ""}, "photomotor": {"od": "", "oi": ""}, "accommodative": {"od": "", "oi": ""}}			{"refraction": {"od": "", "oi": ""}, "subjective": {"od": "", "oi": ""}, "autorefract": {"od": "", "oi": ""}, "keratometry": {"od": "", "oi": ""}}						2026-04-02 11:28:58.816351	2026-04-02 13:49:31.217991		f		[]	ff3f49aa-6a6f-4634-ba63-823f84d23d31	\N	\N	\N	\N	\N
3416d142-d1c3-4a0b-b3b1-d49ca63ed652	d67dcc35-dd4a-4355-9d08-da3a19796932	32f5a2a3-5758-4fb6-b4b6-ec55414942e7		t	\N	no ve de lejos	estable	ninguno										{"exophoria": {"od": "", "oi": "", "value": "", "applies": ""}, "exotropia": {"od": "", "oi": "", "value": "", "applies": ""}, "endophoria": {"od": "", "oi": "", "value": "", "applies": ""}, "endotropia": {"od": "", "oi": "", "value": "", "applies": ""}, "hypotropia": {"od": "", "oi": "", "value": "", "applies": ""}, "alternating": {"od": "", "oi": "", "value": "", "applies": ""}, "hyperphoria": {"od": "", "oi": "", "value": "", "applies": ""}}	-0,5	-0,5	-0,5		-0,5	-0,5	-0,5						["bifocales", "acomodativos u ocupacionales"]	{"consensual": {"od": "", "oi": ""}, "photomotor": {"od": "", "oi": ""}, "accommodative": {"od": "", "oi": ""}}			{"refraction": {"od": "", "oi": ""}, "subjective": {"od": "", "oi": ""}, "autorefract": {"od": "", "oi": ""}, "keratometry": {"od": "", "oi": ""}}				todo bien	nice	2026-03-06 12:09:43.021739	2026-04-06 16:18:27.968516	desarrollador	t		["fotocrom├ítico", "antireflejo", "transition", "filtro de luz azul"]	ff3f49aa-6a6f-4634-ba63-823f84d23d31	\N	\N	\N	\N	\N
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.companies (id, name, code, is_active, created_at, updated_at, logo_file_id, email, phone, slug, max_users, max_branches) FROM stdin;
ff3f49aa-6a6f-4634-ba63-823f84d23d31	Sorti	1231231230	t	2025-11-11 17:08:19.816412	2026-03-31 16:16:50.004675	353d3b8e-7a00-49f4-8118-dafdcf1b761d	sorti@gmail.com	1231231230	sorti	\N	3
\.


--
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feedback (id, company_id, branch_id, created_by_user_id, type, status, title, description, created_at, updated_at) FROM stdin;
1d23122a-5bb0-46af-9af1-83542ed957b4	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	874bf18a-38d4-4d89-a3fc-0e632363cd36	suggestion	en_revision	A├▒adir un color mas oscuro	me gustaria que el sistema tenga modo oscuro y modo claro	2026-03-09 14:37:31.314302	2026-03-09 14:44:11.130041
36190a0b-2873-4915-a29a-1cdec28e8beb	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	874bf18a-38d4-4d89-a3fc-0e632363cd36	suggestion	nuevo	prueba de imagenes	subir├® 3	2026-03-09 15:48:50.080676	2026-03-09 15:48:50.080676
\.


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.files (id, filename, original_name, path, size, mime_type, entity_type, entity_id, file_category, is_active, created_at, updated_at, is_cover) FROM stdin;
e6c0ab69-192d-42b7-b01b-659ae590eb0b	87898d17-367e-422e-8d73-6e02ce72e704	blob	uploads/user/profile_photo/87898d17-367e-422e-8d73-6e02ce72e704	198702	image/jpeg	user	6a6c9140-dd63-4af1-98ca-efe040fc3913	profile_photo	t	2025-08-28 11:44:16.916767	2025-08-28 11:44:16.916767	f
33395319-cb88-4515-9931-8d750180f62e	9d906ea3-acd2-4507-a6fc-1118ec6bf10f	blob	uploads/user/profile_photo/9d906ea3-acd2-4507-a6fc-1118ec6bf10f	420950	image/jpeg	user	25f8598d-dbad-4473-8889-dd86195fe42b	profile_photo	t	2025-10-03 11:53:54.43137	2025-10-03 11:53:54.43137	f
cb9ec355-0507-4b0f-8406-c9638dbf458b	9d948dc0-a6ea-4cc7-93ec-722b3c7f7b79	blob	uploads/user/profile_photo/9d948dc0-a6ea-4cc7-93ec-722b3c7f7b79	244088	image/jpeg	user	69d7587e-fe66-41db-b8bf-9b3d8df0c3b8	profile_photo	t	2025-10-21 10:55:44.391652	2025-10-21 10:55:44.391652	f
50cdf735-2c77-4650-8ee7-de67b77aa173	56a3164a-55de-4d34-8640-757789022c94.jpeg	WhatsApp Image 2025-10-13 at 14.25.28.jpeg	uploads/product/product_image/56a3164a-55de-4d34-8640-757789022c94.jpeg	87142	image/jpeg	product	de5402b9-ed43-4040-8674-61d638267180	product_image	t	2025-10-23 17:07:27.377404	2025-10-23 17:07:27.377404	t
0ba08fc5-b246-4744-966f-862c6ef3cf61	949d6f6b-5ffd-4705-9943-3c2a1f70a089.png	master chef.png	uploads/product/product_image/949d6f6b-5ffd-4705-9943-3c2a1f70a089.png	397768	image/png	product	c7012b23-4d56-4e84-9904-96a87a2f1c37	product_image	t	2025-10-29 11:50:37.349021	2025-10-29 11:50:37.349021	t
425f09f4-7f99-4605-9cce-2efcf27c6982	30a3cd22-55f7-4af8-b9f0-000a7778a1e7.jpeg	WhatsApp Image 2025-10-02 at 15.09.24.jpeg	uploads/product/product_image/30a3cd22-55f7-4af8-b9f0-000a7778a1e7.jpeg	40694	image/jpeg	product	a23a57df-b5d7-47ae-8fb8-b644940527d9	product_image	t	2025-11-05 09:49:05.105392	2025-11-05 09:49:05.105392	t
419fcdf2-3db8-4e81-a095-11c4c5b93594	7beac90e-4ece-4b0a-884e-ea87972e18a5.jpeg	WhatsApp Image 2025-10-13 at 14.25.28.jpeg	uploads/company/company_logo/7beac90e-4ece-4b0a-884e-ea87972e18a5.jpeg	75980	image/jpeg	company	3106d769-396f-4be9-be2c-563010c2b74c	company_logo	t	2025-11-10 09:47:34.777547	2025-11-10 09:47:34.777547	f
d3959936-b4ef-4747-8e71-05d27798359d	caa4ff8d-3cbb-4522-a84d-cbac6e046689.png	default-avatar.png	uploads/company/company_logo/caa4ff8d-3cbb-4522-a84d-cbac6e046689.png	13091	image/png	company	8f0416a6-35f0-418c-a842-01febbf49035	company_logo	t	2025-11-10 10:03:00.818814	2025-11-10 10:03:00.818814	f
2a0629cb-e693-43e4-8b0d-c827e3afc206	c9537897-ac79-4b82-8e34-8d013537e523.jpeg	descarga (4).jpeg	uploads/product/product_image/c9537897-ac79-4b82-8e34-8d013537e523.jpeg	167050	image/jpeg	product	c7a1f80b-e20c-42ee-bfb9-a28770e9f1cf	product_image	t	2025-11-10 11:55:49.142981	2025-11-10 11:55:49.142981	t
6dcfec65-5a64-4b81-b298-08186ec81c87	b22ec9ab-cdbe-42c2-b653-7d9d2f9db5b6.jpg	jost.jpg	uploads/patient/profile_photo/b22ec9ab-cdbe-42c2-b653-7d9d2f9db5b6.jpg	70464	image/jpeg	patient	524d69f7-4784-4b78-af56-1c97223e7ef7	profile_photo	f	2025-11-14 11:26:04.635117	2025-11-17 11:26:17.821672	f
f44f08bf-f6f1-48e2-978d-4573bae57c9e	af7f4c54-0d74-4ce4-b0f7-afc3fda1f699.png	ofta.png	uploads/patient/profile_photo/af7f4c54-0d74-4ce4-b0f7-afc3fda1f699.png	38717	image/png	patient	524d69f7-4784-4b78-af56-1c97223e7ef7	profile_photo	f	2025-11-14 11:38:10.083793	2025-11-17 11:26:17.821672	f
82913553-a284-42ab-9001-8e685a3c57b0	a4818db8-f194-405b-835d-9084ae4bd8c1.jpg	jost.jpg	uploads/patient/profile_photo/a4818db8-f194-405b-835d-9084ae4bd8c1.jpg	70464	image/jpeg	patient	524d69f7-4784-4b78-af56-1c97223e7ef7	profile_photo	t	2025-11-17 11:26:17.828134	2025-11-17 11:26:17.828134	f
50fe07b5-0556-4eb7-b901-00f0f9bdd1cc	ddc94285-2c9a-4ce9-ace4-8d649c3ee2d0.jpg	armazon-mujer.jpg	uploads/product/product_image/ddc94285-2c9a-4ce9-ace4-8d649c3ee2d0.jpg	40752	image/jpeg	product	c01b9ba8-b79c-4303-b41e-8f66ff21076b	product_image	t	2026-03-02 14:49:38.748846	2026-03-02 14:49:38.748846	t
f038cf49-db9b-488a-beb0-7861aaa9a23c	5c596575-15c3-4e7c-9960-e9a3b58ed285.jpg	armazon-hombre.jpg	uploads/product/product_image/5c596575-15c3-4e7c-9960-e9a3b58ed285.jpg	44376	image/jpeg	product	73a27423-facd-4e0d-b4e2-f50b17e117e3	product_image	t	2026-03-02 14:50:32.47855	2026-03-02 14:50:32.47855	t
3ea5ceb0-ba30-4c9e-9a2d-0bd1df5138b8	31d1f549-f423-4cbf-b692-9f70f014f99b.jpg	istockphoto-1296205063-612x612.jpg	uploads/company/company_logo/31d1f549-f423-4cbf-b692-9f70f014f99b.jpg	19433	image/jpeg	company	ff3f49aa-6a6f-4634-ba63-823f84d23d31	company_logo	f	2025-11-11 17:08:19.881442	2026-03-02 16:37:27.104648	f
06c9dbb8-23ba-492a-90b9-3aa291cabe32	43bc7422-679a-410d-856e-bcf8429829d6.png	sorti.png	uploads/company/company_logo/43bc7422-679a-410d-856e-bcf8429829d6.png	8919	image/png	company	ff3f49aa-6a6f-4634-ba63-823f84d23d31	company_logo	f	2025-11-12 10:24:21.053679	2026-03-02 16:37:27.104648	f
41c4e88e-b7ab-4f1d-acd0-f831f6e3d763	db6f687b-f882-463b-a73f-0f651b16d240.jpeg	5414a2bf-6dca-461d-969c-22ab97b92045.jpeg	uploads/company/company_logo/db6f687b-f882-463b-a73f-0f651b16d240.jpeg	241824	image/jpeg	company	ff3f49aa-6a6f-4634-ba63-823f84d23d31	company_logo	f	2025-11-12 10:32:59.790905	2026-03-02 16:37:27.104648	f
95976230-86ee-410f-97df-23328745620c	4769a560-3eae-475b-b2fc-76d66220c31e.png	sorti.png	uploads/company/company_logo/4769a560-3eae-475b-b2fc-76d66220c31e.png	8919	image/png	company	ff3f49aa-6a6f-4634-ba63-823f84d23d31	company_logo	f	2025-11-12 10:33:55.476547	2026-03-02 16:37:27.104648	f
353d3b8e-7a00-49f4-8118-dafdcf1b761d	00dbdddd-7d06-49f2-ab95-7a87082bbcd8.jpg	startup.jpg	uploads/company/company_logo/00dbdddd-7d06-49f2-ab95-7a87082bbcd8.jpg	56465	image/jpeg	company	ff3f49aa-6a6f-4634-ba63-823f84d23d31	company_logo	t	2026-03-02 16:37:27.112247	2026-03-02 16:37:27.112247	f
b3e5c7d8-092a-4565-89e8-4a3ea2150d37	d0de5f8f-7305-4572-ac5b-0b2e6031b69b.png	la fabril.png	uploads/product/product_image/d0de5f8f-7305-4572-ac5b-0b2e6031b69b.png	2751	image/png	product	bb54c357-4d9e-4b73-9827-dfdaaf775b76	product_image	t	2026-03-09 09:55:09.887215	2026-03-09 09:55:09.887215	f
2460ed58-1a95-412f-ab21-78396bd8b84a	30aabedf-8ffa-439b-9f7d-6823e6186ef0.jpeg	certificacion.jpeg	uploads/product/product_image/30aabedf-8ffa-439b-9f7d-6823e6186ef0.jpeg	117042	image/jpeg	product	bb54c357-4d9e-4b73-9827-dfdaaf775b76	product_image	t	2026-03-09 09:55:09.90194	2026-03-09 09:55:09.90194	t
ba450e02-0547-41ee-ae9c-9db52679588f	b0dcc945-cb28-4b59-a439-50a380288b21.jpeg	WhatsApp Image 2026-03-04 at 18.16.11.jpeg	uploads/product/product_image/b0dcc945-cb28-4b59-a439-50a380288b21.jpeg	122429	image/jpeg	product	bb54c357-4d9e-4b73-9827-dfdaaf775b76	product_image	t	2026-03-09 09:55:09.992968	2026-03-09 09:55:09.992968	f
53e4eeed-ed86-4d5a-a594-83a8d8cc57de	93ed3b7d-8522-4257-a0e8-947b646562b6.jpg	startup.jpg	uploads/feedback/general/93ed3b7d-8522-4257-a0e8-947b646562b6.jpg	56465	image/jpeg	feedback	1d23122a-5bb0-46af-9af1-83542ed957b4	general	t	2026-03-09 14:37:31.368827	2026-03-09 14:37:31.368827	f
7d34a8cd-15fe-43a6-b794-c0a5e40ce741	665dc424-daed-4da4-945b-b641466d173b.jpeg	004-1.jpeg	uploads/feedback/general/665dc424-daed-4da4-945b-b641466d173b.jpeg	154859	image/jpeg	feedback	36190a0b-2873-4915-a29a-1cdec28e8beb	general	t	2026-03-09 15:48:50.091691	2026-03-09 15:48:50.091691	f
c793f1cb-8466-4764-9cd5-19575e16d631	7fbe3212-feb5-4317-aa71-053b7539abb2.jpeg	003-1.jpeg	uploads/feedback/general/7fbe3212-feb5-4317-aa71-053b7539abb2.jpeg	111812	image/jpeg	feedback	36190a0b-2873-4915-a29a-1cdec28e8beb	general	t	2026-03-09 15:48:50.09757	2026-03-09 15:48:50.09757	f
59dd6bb4-13ea-4384-ae88-ad93aadb6e55	9ecee9b4-e387-482b-a38a-a5c4003791d7.png	aquaponics-3-750.png	uploads/feedback/general/9ecee9b4-e387-482b-a38a-a5c4003791d7.png	163387	image/png	feedback	36190a0b-2873-4915-a29a-1cdec28e8beb	general	t	2026-03-09 15:48:50.102159	2026-03-09 15:48:50.102159	f
e096417b-373e-4de6-8a33-ff1994b09e08	730666ea-f916-4999-8773-0455c02d8e9b.jpeg	WhatsApp Image 2026-03-13 at 16.28.57.jpeg	uploads/product/product_image/730666ea-f916-4999-8773-0455c02d8e9b.jpeg	83463	image/jpeg	product	c01b9ba8-b79c-4303-b41e-8f66ff21076b	product_image	t	2026-03-16 14:06:14.484237	2026-03-16 14:06:14.484237	f
89e8cf50-c0bd-449c-ba4a-8ba2a27cf015	fb75651c-d7a4-4858-9856-7fb36f082e2f.png	dise├â┬▒o de bd.png	uploads/product/product_image/fb75651c-d7a4-4858-9856-7fb36f082e2f.png	141711	image/png	product	c01b9ba8-b79c-4303-b41e-8f66ff21076b	product_image	t	2026-03-16 14:06:14.843356	2026-03-16 14:06:14.843356	f
c24f006c-0d69-4c96-a310-0829a1e795e7	606c7485-154b-49ca-a4fb-49bea4a25a42.jpeg	jordan.jpeg	uploads/patient/profile_photo/606c7485-154b-49ca-a4fb-49bea4a25a42.jpeg	65974	image/jpeg	patient	0a6c271b-ce68-434e-87c2-59fb10e59edb	profile_photo	t	2026-04-02 10:00:56.885694	2026-04-02 10:00:56.885694	f
23030930-f76d-417a-a58d-34522ff547db	d854e0a5-4db2-4604-aaa6-0ff98d914157.png	dise├â┬▒o de bd.png	uploads/patient/profile_photo/d854e0a5-4db2-4604-aaa6-0ff98d914157.png	915930	image/png	patient	26401367-18f5-439a-ab66-37c3249b75a7	profile_photo	t	2026-04-02 10:05:29.348462	2026-04-02 10:05:29.348462	f
708aa084-52e3-407f-b7d7-00d6d8cac95d	f6d92509-beff-4ef0-b477-849b205be3f8.jpeg	autoria.jpeg	uploads/patient/profile_photo/f6d92509-beff-4ef0-b477-849b205be3f8.jpeg	52852	image/jpeg	patient	25cb7d0d-7e6c-4fa0-84fd-757948341b94	profile_photo	t	2026-04-02 10:24:09.204686	2026-04-02 10:24:09.204686	f
0d34ce8b-90da-4c78-83d7-3cdabc9329c3	0652752d-9a95-438b-8268-948c1afabc57.png	la fabril.png	uploads/patient/profile_photo/0652752d-9a95-438b-8268-948c1afabc57.png	3198	image/png	patient	c5023ccd-fb6d-41d5-a641-1ecd2d018334	profile_photo	t	2026-04-02 10:50:50.257275	2026-04-02 10:50:50.257275	f
\.


--
-- Data for Name: inventory_transfers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_transfers (id, company_id, source_branch_id, target_branch_id, source_product_id, target_product_id, source_code, quantity, note, created_by_user_id, created_at) FROM stdin;
90e977c4-2a90-4d84-b74c-6c0ff8c1824a	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	de8015dd-7b85-48a0-ab93-87be7b427ee5	c01b9ba8-b79c-4303-b41e-8f66ff21076b	9c9fe253-bd97-4480-a552-8ba21a4ba17b	001	1	paso de stock, envia tiene 11 y recibe tiene 33, al final tendria que haber 10 y 34	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-05 16:43:07.832972
18faa4db-2388-4ed0-9a19-95b176632776	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	de8015dd-7b85-48a0-ab93-87be7b427ee5	c01b9ba8-b79c-4303-b41e-8f66ff21076b	9c9fe253-bd97-4480-a552-8ba21a4ba17b	001	9	transfiero mas de lo que hay	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-05 16:49:21.981997
d8249bfc-a17c-4d1a-9489-4f00f93137b6	ff3f49aa-6a6f-4634-ba63-823f84d23d31	de8015dd-7b85-48a0-ab93-87be7b427ee5	d67dcc35-dd4a-4355-9d08-da3a19796932	9c9fe253-bd97-4480-a552-8ba21a4ba17b	c01b9ba8-b79c-4303-b41e-8f66ff21076b	001	13	\N	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-05 18:56:20.544203
57e81ee1-7d7c-425e-9a1b-db85e284b466	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	de8015dd-7b85-48a0-ab93-87be7b427ee5	c01b9ba8-b79c-4303-b41e-8f66ff21076b	9c9fe253-bd97-4480-a552-8ba21a4ba17b	001	4	el que envia le quedar├ín 10	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-06 10:22:17.928759
0fc2160f-dea5-409a-bf7c-32c03c41bd98	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	de8015dd-7b85-48a0-ab93-87be7b427ee5	c01b9ba8-b79c-4303-b41e-8f66ff21076b	9c9fe253-bd97-4480-a552-8ba21a4ba17b	001	5	se envian 5 quedan 5	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-06 10:53:01.543636
ce33000a-6fbd-4d39-baf4-a74bd4153add	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	de8015dd-7b85-48a0-ab93-87be7b427ee5	c01b9ba8-b79c-4303-b41e-8f66ff21076b	9c9fe253-bd97-4480-a552-8ba21a4ba17b	001	1	se envian 3 quedan 2	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-06 11:11:51.87693
58b3234e-d479-43bc-b1b2-724a4bf0cabd	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	de8015dd-7b85-48a0-ab93-87be7b427ee5	73a27423-facd-4e0d-b4e2-f50b17e117e3	cc1efab3-f5e4-45ba-9ccc-67d4cc3a0e91	002	2	envio 2, mequedan 3 y en la otra se debe crear	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-09 10:40:19.102884
34727b88-86a3-471c-bb59-7a949e447e13	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	de8015dd-7b85-48a0-ab93-87be7b427ee5	0b829499-376c-4934-848d-0c30ec647a69	b2e27594-8197-4617-ab30-95aa26b22a9a	7622201764999	3	\N	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-31 17:14:53.473334
36fd0e59-0064-4072-a0db-c206684cae01	ff3f49aa-6a6f-4634-ba63-823f84d23d31	de8015dd-7b85-48a0-ab93-87be7b427ee5	d67dcc35-dd4a-4355-9d08-da3a19796932	b2e27594-8197-4617-ab30-95aa26b22a9a	0b829499-376c-4934-848d-0c30ec647a69	7622201764999	2	\N	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-31 17:17:40.050536
\.


--
-- Data for Name: laboratory_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.laboratory_orders (id, branch_id, patient_id, clinical_history_id, attendance_date, delivery_date, od_sphere, od_cylinder, od_axis, od_add, od_height, od_dnp, oi_sphere, oi_cylinder, oi_axis, oi_add, oi_height, oi_dnp, d_vertex, pantos, panora, frame_fit, profile, mid, dist_vp, engraving, product_id, frame_type, frame_type_description, frame_brand, frame_model, frame_data, frame_larger_diameter, frame_horizontal, frame_vertical, frame_bridge, observations, is_confirmed, created_at, updated_at, order_number, cbase, sun_degree, prism, base, company_id, product_ids, product_quantities, status, client_id) FROM stdin;
52599b80-3cec-4413-9d69-2bdbc2fc8bb5	d67dcc35-dd4a-4355-9d08-da3a19796932	524d69f7-4784-4b78-af56-1c97223e7ef7	dbb7de2b-0e35-4e62-871a-2dd7e5b9c1a3	2025-11-17	2025-11-29	test	test	test	test	test	test	test	test	test	test	test	test	test	test	test	test	test	test	test	test	\N	completo	\N	\N	\N	test	test	test	test	test	testt	f	2025-11-17 17:07:03.82243	2025-11-17 17:13:21.143911	1	test	test	test	test	ff3f49aa-6a6f-4634-ba63-823f84d23d31	\N	\N	pending	\N
77f17a58-b034-4fe3-947d-12bd5a8fae07	d67dcc35-dd4a-4355-9d08-da3a19796932	3c383330-de98-4617-9b9d-b9406c92ed0b	980793ce-e9c5-4c78-b153-27ac6a3e26b5	\N	2026-03-26	esfera	cilindro	eje	add 	altura	dnp	esfera i	cilindro i	eje i	add i	altura i	dnp i	vertice	pantos	panora	calce de montura	perfil	mid	dist vp	tallado	73a27423-facd-4e0d-b4e2-f50b17e117e3	completo	completo la adicional	trigger, rayban	armazon de plastico, armazon de metal	son varios armazones	diametro mayor	horizontal	vertical	puente	ningun observacion final	f	2026-03-02 16:20:33.832768	2026-03-02 16:20:33.832768	2	base 	grado sol	prisma	base	ff3f49aa-6a6f-4634-ba63-823f84d23d31	{73a27423-facd-4e0d-b4e2-f50b17e117e3,c01b9ba8-b79c-4303-b41e-8f66ff21076b}	\N	pending	\N
aa85b885-7ef2-4a5b-acaf-ce68e99a55e6	d67dcc35-dd4a-4355-9d08-da3a19796932	32f5a2a3-5758-4fb6-b4b6-ec55414942e7	3416d142-d1c3-4a0b-b3b1-d49ca63ed652	2026-03-06	2026-03-13	-0,5	-0,5	-0,25		\N	\N	-0,5	-0,5	-0,25		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	73a27423-facd-4e0d-b4e2-f50b17e117e3	completo	\N	trigger	armazon de plastico	\N	\N	\N	\N	\N	\N	f	2026-03-06 12:13:19.23831	2026-03-06 12:13:19.23831	3	\N	\N	\N	\N	ff3f49aa-6a6f-4634-ba63-823f84d23d31	{73a27423-facd-4e0d-b4e2-f50b17e117e3}	\N	pending	\N
0e55a054-4365-43fd-b190-0a4cba0fc47f	d67dcc35-dd4a-4355-9d08-da3a19796932	32f5a2a3-5758-4fb6-b4b6-ec55414942e7	3416d142-d1c3-4a0b-b3b1-d49ca63ed652	2026-03-06	2026-03-27	-0,5	-0,5	-0,5		\N	\N	-0,5	-0,5	-0,5		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N			\N	\N	\N	\N	\N	\N	f	2026-03-16 11:35:02.867491	2026-03-16 11:35:02.867491	4	\N	\N	\N	\N	ff3f49aa-6a6f-4634-ba63-823f84d23d31	{}	\N	pending	\N
64f25ad5-55f2-45fe-95f6-36e8f07dfc18	d67dcc35-dd4a-4355-9d08-da3a19796932	32f5a2a3-5758-4fb6-b4b6-ec55414942e7	3416d142-d1c3-4a0b-b3b1-d49ca63ed652	2026-03-06	2026-03-20	-0,5	-0,5	-0,5	2	2	2	-0,5	-0,5	-0,5	2	2	2	\N	\N	\N	\N	\N	\N	\N	\N	0b829499-376c-4934-848d-0c30ec647a69	completo	ninguna informacion adicional	trigger	codigo de barras trident, armazon de plastico	todo normal	diametro	horizontal	vertical	puente	observaciones step 3	f	2026-03-19 18:41:32.922826	2026-03-19 18:41:32.922826	5	base	sol	prisma	base	ff3f49aa-6a6f-4634-ba63-823f84d23d31	{0b829499-376c-4934-848d-0c30ec647a69,73a27423-facd-4e0d-b4e2-f50b17e117e3}	\N	pending	\N
88c8e7ed-b0d6-46c3-b01b-e9546332e5de	d67dcc35-dd4a-4355-9d08-da3a19796932	32f5a2a3-5758-4fb6-b4b6-ec55414942e7	3416d142-d1c3-4a0b-b3b1-d49ca63ed652	2026-03-06	2026-04-24	-0,5	-0,5	-0,5		2	2	-0,5	-0,5	-0,5		2	2	\N	\N	\N	\N	\N	\N	\N	\N	0b829499-376c-4934-848d-0c30ec647a69	\N	\N	trigger	7622201764999 - codigo de barras trident, 002 - armazon de plastico	\N	\N	\N	\N	\N	\N	f	2026-04-06 14:34:21.737308	2026-04-06 14:34:21.737308	8	base	sol	prisma	base	ff3f49aa-6a6f-4634-ba63-823f84d23d31	{0b829499-376c-4934-848d-0c30ec647a69,73a27423-facd-4e0d-b4e2-f50b17e117e3}	[{"quantity": 1, "productId": "0b829499-376c-4934-848d-0c30ec647a69"}, {"quantity": 1, "productId": "73a27423-facd-4e0d-b4e2-f50b17e117e3"}]	pending	e325341b-b990-4870-a0a5-de193e4075f1
8fcb9caf-14ff-4075-8cc7-656d73b53832	d67dcc35-dd4a-4355-9d08-da3a19796932	32f5a2a3-5758-4fb6-b4b6-ec55414942e7	3416d142-d1c3-4a0b-b3b1-d49ca63ed652	2026-03-06	2026-04-24	-0,5	-0,5	-0,5		2	2	-0,5	-0,5	-0,5		2	2	\N	\N	\N	\N	\N	\N	\N	\N	0b829499-376c-4934-848d-0c30ec647a69	\N	\N	trigger	7622201764999 - codigo de barras trident, 002 - armazon de plastico	10 y 2	\N	\N	\N	\N	\N	f	2026-04-01 11:51:54.891218	2026-04-01 13:57:57.603191	6	base	sol	prisma	base	\N	{0b829499-376c-4934-848d-0c30ec647a69,73a27423-facd-4e0d-b4e2-f50b17e117e3}	[{"quantity": 2, "productId": "0b829499-376c-4934-848d-0c30ec647a69"}, {"quantity": 3, "productId": "73a27423-facd-4e0d-b4e2-f50b17e117e3"}]	pending	\N
ce6958b6-9634-4230-9fd9-b4bde2f6ab46	d67dcc35-dd4a-4355-9d08-da3a19796932	0a6c271b-ce68-434e-87c2-59fb10e59edb	df939fd8-fc3d-4af4-a522-e71a9c1351f3	2026-04-02	2026-04-16					\N	\N					\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0b829499-376c-4934-848d-0c30ec647a69	\N	\N	trigger	7622201764999 - codigo de barras trident, 002 - armazon de plastico	8 y 2	di	hor	verti	puente	obs	f	2026-04-02 13:49:31.217991	2026-04-02 13:49:31.217991	7	base test	sol test	prisma test	base test	ff3f49aa-6a6f-4634-ba63-823f84d23d31	{0b829499-376c-4934-848d-0c30ec647a69,73a27423-facd-4e0d-b4e2-f50b17e117e3}	[{"quantity": 2, "productId": "0b829499-376c-4934-848d-0c30ec647a69"}, {"quantity": 1, "productId": "73a27423-facd-4e0d-b4e2-f50b17e117e3"}]	pending	343770d0-ecfe-4d8e-93f9-d77b2e187f3f
ad04f627-e8cc-4c5f-8ee0-4c7365d52e02	d67dcc35-dd4a-4355-9d08-da3a19796932	32f5a2a3-5758-4fb6-b4b6-ec55414942e7	3416d142-d1c3-4a0b-b3b1-d49ca63ed652	2026-03-06	2026-04-22	-0,5	-0,5	-0,5		2	2	-0,5	-0,5	-0,5		2	2	\N	\N	\N	\N	\N	\N	\N	\N	0b829499-376c-4934-848d-0c30ec647a69	\N	\N	trigger	7622201764999 - codigo de barras trident	\N	di	hori	vert	puente	\N	f	2026-04-06 16:18:27.968516	2026-04-06 16:18:27.968516	9	base	sol	prisma	base	ff3f49aa-6a6f-4634-ba63-823f84d23d31	{0b829499-376c-4934-848d-0c30ec647a69}	[{"quantity": 1, "productId": "0b829499-376c-4934-848d-0c30ec647a69"}]	pending	c74d74c4-05a1-4dc8-bf73-e6a5e9fa9d2a
\.


--
-- Data for Name: message_dispatch_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.message_dispatch_logs (id, company_id, branch_id, patient_id, campaign_id, status, channel, phone, message, scheduled_at, sent_at, provider_message_id, error_reason, created_at, updated_at) FROM stdin;
94b8c2a2-5072-4d3d-a1c6-d415b0c87b1a	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	524d69f7-4784-4b78-af56-1c97223e7ef7	\N	sent	whatsapp	+593998411681	Hola jostinm bajana, este es un recordatorio de prueba de renovaci´┐¢n.	2026-03-18 19:22:03.886	2026-03-18 19:22:12.213	true_593998411681@c.us_3EB0A251B1BA3FFB75824A	\N	2026-03-18 19:22:03.891694	2026-03-18 19:22:12.219341
0fd29923-1c7b-4a5a-8171-0028788f2c3d	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	524d69f7-4784-4b78-af56-1c97223e7ef7	\N	sent	whatsapp	+593998411681	Hola jostinm bajana, te recordamos que tu renovaci├│n de lentes est├í pr├│xima. Agenda tu cita cuando gustes.	2026-03-18 19:24:33.718	2026-03-18 19:24:33.778	true_593998411681@c.us_3EB0FD65D7F1618D2AFDFF	\N	2026-03-18 19:24:33.719836	2026-03-18 19:24:33.788095
6948adb5-1def-4c7e-b9a7-744f69b4c333	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	32f5a2a3-5758-4fb6-b4b6-ec55414942e7	\N	sent	whatsapp	+593979550132	Hola fabricio zavala, te recordamos que tu renovaci├│n de lentes est├í pr├│xima. Agenda tu cita cuando gustes. el que lo lea es gay	2026-03-18 19:25:03.939	2026-03-18 19:25:03.996	true_593979550132@c.us_3EB05491D5D23274502493	\N	2026-03-18 19:25:03.940654	2026-03-18 19:25:04.004776
52eab113-11ac-4518-81d8-b64b8f912ecd	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	524d69f7-4784-4b78-af56-1c97223e7ef7	\N	sent	whatsapp	+593998411681	Hola jostinm bajana, te recordamos que tu renovaci├│n de lentes est├í pr├│xima. Agenda tu cita cuando gustes. test de conexion	2026-03-19 11:16:04.212	2026-03-19 11:16:04.27	true_593998411681@c.us_3EB06A65D325E5A7969B64	\N	2026-03-19 11:16:04.223971	2026-03-19 11:16:04.284496
0808c413-0de6-43ab-ace3-e43232bc8743	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	524d69f7-4784-4b78-af56-1c97223e7ef7	\N	sent	whatsapp	+593998411681	Hola jostinm bajana, te recordamos que tu renovaci├│n de lentes est├í pr├│xima. Agenda tu cita cuando gustes. prueba 2	2026-03-19 11:32:04.928	2026-03-19 11:32:04.96	true_593998411681@c.us_3EB0874813B7C8484B2516	\N	2026-03-19 11:32:04.929337	2026-03-19 11:32:04.964529
5104822a-60af-48c3-b091-616a34a0b8b0	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	524d69f7-4784-4b78-af56-1c97223e7ef7	\N	sent	whatsapp	+593998411681	Hola jostinm bajana, te recordamos que tu renovaci├│n de lentes est├í pr├│xima. Agenda tu cita cuando gustes.	2026-03-19 12:10:07.103	2026-03-19 12:10:07.201	true_593998411681@c.us_3EB03FF028CECA2B1C292F	\N	2026-03-19 12:10:07.104411	2026-03-19 12:10:07.207233
663b4f68-4e93-4960-a5d7-f547a837cdb7	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	32f5a2a3-5758-4fb6-b4b6-ec55414942e7	\N	sent	whatsapp	+593962766008	Hola fabricio zavala, te recordamos que tu renovaci├│n de lentes est├í pr├│xima. Agenda tu cita cuando gustes.	2026-03-19 12:10:48.065	2026-03-19 12:10:48.326	true_593962766008@c.us_3EB0EE14C6D046E34A2FB0	\N	2026-03-19 12:10:48.066726	2026-03-19 12:10:48.332615
457aac9e-7430-4a8c-900a-8802f5d49f74	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	32f5a2a3-5758-4fb6-b4b6-ec55414942e7	\N	sent	whatsapp	+593962766008	Hola fabricio zavala, te recordamos que tu renovaci├│n de lentes est├í pr├│xima. Agenda tu cita cuando gustes. test	2026-03-19 12:17:58.149	2026-03-19 12:17:58.202	true_593962766008@c.us_3EB07560A16BF0E6B66DF0	\N	2026-03-19 12:17:58.149949	2026-03-19 12:17:58.208585
d5de92f4-50be-4cd0-8e06-1128c38d30d8	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	524d69f7-4784-4b78-af56-1c97223e7ef7	\N	sent	whatsapp	+593998411681	test de conexion a whats	2026-03-19 15:43:55.825	2026-03-19 15:43:55.871	true_593998411681@c.us_3EB0FF9F407F0453C0CFC2	\N	2026-03-19 15:43:55.826047	2026-03-19 15:43:55.876953
96dd8790-bd4b-4e19-b990-eaae0559731e	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	524d69f7-4784-4b78-af56-1c97223e7ef7	\N	sent	whatsapp	+593998411681	Hola jostinm bajana, te recordamos que tu renovaci├│n de lentes est├í pr├│xima. Agenda tu cita cuando gustes. tu cedul es 1231231235	2026-03-24 11:07:39.251	2026-03-24 11:07:48.635	true_593998411681@c.us_3EB078DD3DFA9B42475EE6	\N	2026-03-24 11:07:39.255279	2026-03-24 11:07:48.642074
17da3df1-1f25-4f35-b0dd-de074cf8e66b	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	524d69f7-4784-4b78-af56-1c97223e7ef7	\N	sent	whatsapp	+593998411681	este es un test no responder	2026-03-27 17:50:39.338	2026-03-27 17:50:40.893	true_593998411681@c.us_3EB0A85B183D2E74F99BFB	\N	2026-03-27 17:50:39.348041	2026-03-27 17:50:40.904224
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
1	1692123456789	InitRolesPermissions1692123456789
2	1692123456789	InitRbac1692123456789
3	1692123456790	SeedBasePermissions1692123456790
4	1762470000000	AddProductIdsToLaboratoryOrders1762470000000
5	1762471000000	AddFinalizadoShiftStatus1762471000000
6	1762472000000	EnsureFinalizadoShiftStatusActive1762472000000
7	1762473000000	AddCompanyPlanLimits1762473000000
8	1762575000000	AlterBranchOpeningHoursToText1762575000000
9	1762723000000	AddStockTransferAndCodeConstraints1762723000000
10	1762800000000	AddSupplierContactRedirectFields1762800000000
11	1762901000000	CreateFeedbackTable1762901000000
12	1762902000000	SeedFeedbackModulePermissions1762902000000
13	1762903000000	CreateProductDiscountTable1762903000000
14	1763010000000	CreateProductAuditLogTable1763010000000
16	1763489000000	CreateNotificationsMvpTables1763489000000
17	1763492000000	AddUseridToWhatsappSessions1763492000000
18	1763493000000	EnsureNotificationsAndSeedWhatsappAccess1763493000000
19	1764001000000	AddPreviousRxVlVpAoFields1764001000000
20	1765051000000	AddProductQuantitiesToLaboratoryOrders1765051000000
21	1765052000000	AddStatusToLaboratoryOrders1765052000000
22	1743667200000	CreateClientsAndPurchaseOrders1743667200000
23	1765053000000	SeedPurchaseOrdersModulePermission1765053000000
24	1765054000000	AllowNullPatientIdOnClients1765054000000
25	1765055000000	SeedClientsModulePermission1765055000000
26	1765060000000	CreateClientPatientsBridge1765060000000
27	1765061000000	CreatePurchaseOrderItems1765061000000
\.


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.modules (id, module_name, description, is_active, created_at, updated_at) FROM stdin;
3256d577-9660-49c3-b0d4-d8e40fed5e70	Dashboard	Este es el modulo de Dashboard	t	2025-08-21 13:37:32.94191	2025-08-21 13:37:32.94191
a51560f7-474b-45f6-9bb5-cd63d215f7c3	Usuarios	Este es el modulo de Usuarios	t	2025-08-26 16:06:49.551012	2025-08-26 16:06:49.551012
f915e55d-b226-4431-89c2-77d43bfc19bd	Roles-Permisos	Este es el modulo de Roles y permisos	t	2025-08-26 16:09:28.431926	2025-08-26 16:09:28.431926
0c231748-9f78-40ec-a6ea-7cbac55bfe93	Inventario	Este modulo es sobre el inventario de la optica	t	2025-09-02 12:09:10.143798	2025-09-02 12:09:10.143798
6dd05ec4-d197-49f5-bdfc-2ba2d49e1531	Historial Clinico	Modulo para ver el historial del paciente	t	2025-09-02 16:59:17.577641	2025-09-02 16:59:17.577641
dc862858-58c6-47c3-997e-a16d77c8b891	Gesti├│n de turnos	Este modulo contiene la gestion de los turnos	t	2025-09-03 09:33:14.051808	2025-09-03 09:33:14.051808
1ba0cc8d-774d-4563-a371-8560fe0b65dd	Sucursales	Este modulo contiene las sucursales	t	2025-09-03 14:38:58.024395	2025-09-03 14:38:58.024395
6830335e-90e4-4114-812f-51e5e50a2b02	Calendario	Este modulo es sobre el calendario de citas medicas	t	2025-09-03 15:58:36.191856	2025-09-03 15:58:36.191856
a657f1e6-2763-4279-a707-a00fd0dcad8e	Ordenes de laboratorio	este modulo contiene todas las ordenes del laboratorio	t	2025-09-09 10:21:47.658482	2025-09-09 10:21:47.658482
ea30afaa-a177-46d7-8263-28e2657658f8	Proveedores	Este modulo es para gestionar los proveedores	t	2025-09-16 09:17:39.703833	2025-09-16 09:17:39.703833
31f2d12e-877d-4090-a282-9f3f57b17aec	Categorias	modulo de categorias	t	2025-09-16 11:09:54.868459	2025-09-16 11:09:54.868459
5c6ebc55-f3f9-41db-a949-df38d941b510	Filtro de sucursales	sirve para cambiar entre sucursales del sistema	t	2025-10-27 14:06:57.893402	2025-10-27 14:06:57.893402
c2b2463b-1c97-43e6-b904-054dffbed1f4	Pacientes	Modulo que administra los pacientes del sistema	t	2025-11-14 09:43:06.873839	2025-11-14 09:43:06.873839
c828ad37-33c9-4949-b99a-f8b8ff21a085	Feedback	Este modulo sirve para enviar sugerencias, quejas y demas ideas	t	2026-03-09 11:41:51.793085	2026-03-09 11:41:51.793085
248bccd0-7d98-4e46-80df-11d8d22102eb	WhatsApp	modulo que envia mensajes por WhatsApp a los pacientes	t	2026-03-19 15:21:23.178103	2026-03-19 15:21:23.178103
607b9108-9dfd-45a8-b75a-22c6974d7fd4	Orden de Pedido	Este modulo contiene las ordenes de compras que se han hecho en el sistema	t	2026-04-02 12:06:28.39703	2026-04-02 12:06:28.39703
bdf9c4f6-e607-4bce-9f88-490ef5b65d36	Clientes	Este modulo permite ver u ocultar los clientes del sistema	t	2026-04-06 10:01:11.91943	2026-04-06 10:01:11.91943
\.


--
-- Data for Name: notification_campaigns; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_campaigns (id, company_id, branch_id, name, type, status, message_template, scheduled_at, processed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: patient_contact_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.patient_contact_preferences (id, company_id, branch_id, patient_id, preferred_phone, whatsapp_opt_in, promotions_opt_in, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.patients (id, first_name, last_name, email, document_number, company_id, branch_id, date_of_birth, address, home_phone, mobile_phone, profile_photo, is_active, created_at, updated_at) FROM stdin;
3c383330-de98-4617-9b9d-b9406c92ed0b	mark	proa├▒oo	mark@gmail.com	1231231234	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	2025-11-01 19:00:00	las cumbres	123123	1231231231	\N	t	2025-11-14 10:51:26.423804	2025-11-18 12:12:32.177527
ba133741-6bc1-4b7c-b90a-e4492bd8ba13	paciente ficticio de sucursal fictici	test	dsdksd@gmail.com	123404932	ff3f49aa-6a6f-4634-ba63-823f84d23d31	de8015dd-7b85-48a0-ab93-87be7b427ee5	2004-02-11 19:00:00	dfldfdf	\N	\N	\N	t	2026-03-04 14:28:14.994689	2026-03-04 14:28:14.994689
524d69f7-4784-4b78-af56-1c97223e7ef7	jostinm	bajana	jostin12@gmail.com	1231231235	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	2001-11-07 19:00:00	paolas	123123	0998411681	/uploads/patient/profile_photo/a4818db8-f194-405b-835d-9084ae4bd8c1.jpg	t	2025-11-14 11:26:04.596024	2026-03-18 19:04:34.830065
32f5a2a3-5758-4fb6-b4b6-ec55414942e7	fabricio	zavala	fabrii@gmail.com	123123453	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	2026-02-28 19:00:00	manta	\N	0962766008	\N	t	2026-03-03 11:50:18.109687	2026-03-19 11:24:18.819397
515b43a4-1257-40b6-a23c-cc47c1ed3029	irene	reyes	ire@gmail.com	12312345223	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	2026-03-05 19:00:00	\N	\N	\N	\N	t	2026-03-27 16:15:14.221245	2026-03-27 16:15:14.221245
0a6c271b-ce68-434e-87c2-59fb10e59edb	byron	calderon	byron@gmail.com	1231234567	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	2002-04-02 19:00:00	manta	\N	0959563850	/uploads/patient/profile_photo/606c7485-154b-49ca-a4fb-49bea4a25a42.jpeg	t	2026-04-02 10:00:56.782925	2026-04-02 10:00:56.889739
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, permission_name, description, is_active, module_id, created_at, updated_at) FROM stdin;
0669f8b2-2296-436f-bbd1-650c587225ca	mostrar usuarios	muestra u oculta el modulo de usuarios	t	a51560f7-474b-45f6-9bb5-cd63d215f7c3	2025-08-26 16:07:30.931765	2025-08-26 16:07:30.931765
7061e7e7-cc65-4017-b39c-0cb02ca6b8c6	mostrar Roles y Permisos	muestra u oculta el modulo de Roles y Permisos	t	f915e55d-b226-4431-89c2-77d43bfc19bd	2025-08-26 16:10:37.620358	2025-08-26 16:10:37.620358
b960b6bd-de11-40c3-9a84-2e9fd44aad9c	Ver modulo de inventario	este permiso permite Ver el modulo de inventario	t	0c231748-9f78-40ec-a6ea-7cbac55bfe93	2025-09-02 12:09:35.162125	2025-09-02 12:09:35.162125
bc60fcd8-791b-4371-8910-6f21b8baa446	Ver modulo de historial clinico	Este permiso permite ver el modulo de historial clinico	t	6dd05ec4-d197-49f5-bdfc-2ba2d49e1531	2025-09-02 16:59:53.781067	2025-09-02 16:59:53.781067
54f13404-f1b1-4313-9351-8e979058bd28	Ver modulo de gestion de turnos	este permisos permite ver u ocultar el modulo de gestion de turnos	t	dc862858-58c6-47c3-997e-a16d77c8b891	2025-09-03 09:33:52.215359	2025-09-03 09:33:52.215359
66af3090-2664-4faf-8d76-302b6662da5e	Ver modulo de sucursales	Este permiso permite ver el modulo de sucursales	t	1ba0cc8d-774d-4563-a371-8560fe0b65dd	2025-09-03 14:39:21.445936	2025-09-03 14:39:21.445936
3476e77d-5402-49f6-b9c5-29657cc6270f	Ver modulo de calendario	Este permiso permite ver le modulo de calendario	t	6830335e-90e4-4114-812f-51e5e50a2b02	2025-09-03 15:58:56.995894	2025-09-03 15:58:56.995894
926be685-1920-4ca9-88e1-7ce82e2b51ee	ver ordenes de laboratorio	Permite ver u ocultar el modulo de ordenes de laboratorio	t	a657f1e6-2763-4279-a707-a00fd0dcad8e	2025-09-09 10:22:17.756409	2025-09-09 10:22:17.756409
0ec24ecf-9cde-445c-afc7-dde23f7d7477	Ver modulo de proovedores	Este permiso permite mostrar u oculta el modulo de proveedores	t	ea30afaa-a177-46d7-8263-28e2657658f8	2025-09-16 09:18:15.078808	2025-09-16 09:18:15.078808
c69d4b40-0d45-43a7-abb9-e3195ffb382b	Ver categorias	Este permiso permite ver u ocultar el modulo de categorias	t	31f2d12e-877d-4090-a282-9f3f57b17aec	2025-09-16 11:10:18.585262	2025-09-16 11:10:18.585262
58933118-495e-414e-95ba-1629a7e42de8	Ver configuracion de historial clinico	Este permiso muestra u oculta el modulo de configuracion de historial clinico	t	6dd05ec4-d197-49f5-bdfc-2ba2d49e1531	2025-09-25 15:36:10.263005	2025-09-25 15:36:10.263005
27b89d1b-68ad-4055-91ed-3475c4495a7a	Ver filtro de sucursales	Permite mostrar y ocultar el filtro de sucursales	t	5c6ebc55-f3f9-41db-a949-df38d941b510	2025-10-27 14:07:35.223687	2025-10-27 14:07:35.223687
b78c4b4d-aa1f-4157-b0f1-6a873219ebed	mostrar dashboard	muestra u oculta el modulo de dashboard	t	3256d577-9660-49c3-b0d4-d8e40fed5e70	2025-08-21 13:38:15.530549	2025-11-10 16:28:52.817887
1d77ac5d-4342-49b6-8a91-3a120aab48cd	Ver pacientes	Permite mostrar u ocultar el modulo de pacientes	t	c2b2463b-1c97-43e6-b904-054dffbed1f4	2025-11-14 09:43:35.585838	2025-11-14 09:43:35.585838
7ec21b5c-03fa-415c-b6de-59fea2dd2cea	Ver Modulo de Feedback	Este permiso permite ver u ocultar el modulo de feedback	t	c828ad37-33c9-4949-b99a-f8b8ff21a085	2026-03-09 11:42:41.854875	2026-03-09 11:42:41.854875
772ddd04-70cf-4d3c-b4a3-c30b18bf8505	Ver Modulo de WhatsApp	Este permiso permite ver y ocultar el modulo para enviar mensajes por whatsapp	t	248bccd0-7d98-4e46-80df-11d8d22102eb	2026-03-19 15:21:57.783993	2026-03-19 15:21:57.783993
bb505d45-47d5-4205-acbc-88d8ce4287f4	Ver Modulo de Orden de Pedido	Este permiso permite ver y ocultar el modulo de orden de pedido	t	607b9108-9dfd-45a8-b75a-22c6974d7fd4	2026-04-02 12:07:28.391508	2026-04-02 12:07:28.391508
3a759a8f-544a-4625-875a-ffd38c44f577	Ver M├│dulo de Clientes	Este permiso permite ver u ocultar el modulo de clientes	t	bdf9c4f6-e607-4bce-9f88-490ef5b65d36	2026-04-06 10:01:57.594715	2026-04-06 10:01:57.594715
\.


--
-- Data for Name: product_audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_audit_log (id, company_id, branch_id, product_id, event_type, changed_fields, metadata, created_by_user_id, created_at) FROM stdin;
059f5d8e-3cbd-4f3f-b753-3561ee8ae909	ff3f49aa-6a6f-4634-ba63-823f84d23d31	de8015dd-7b85-48a0-ab93-87be7b427ee5	9c9fe253-bd97-4480-a552-8ba21a4ba17b	UPDATED	{"quantity": {"to": 42, "from": 40}}	\N	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-12 10:33:30.75366
dc6b80af-e486-48ff-b0af-21c8187332e7	ff3f49aa-6a6f-4634-ba63-823f84d23d31	de8015dd-7b85-48a0-ab93-87be7b427ee5	cc1efab3-f5e4-45ba-9ccc-67d4cc3a0e91	UPDATED	{"quantity": {"to": 3, "from": 2}}	\N	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-12 10:35:57.505313
4fe9ffc4-e53e-47be-bd9c-c72f8064478c	ff3f49aa-6a6f-4634-ba63-823f84d23d31	de8015dd-7b85-48a0-ab93-87be7b427ee5	cc1efab3-f5e4-45ba-9ccc-67d4cc3a0e91	UPDATED	{"quantity": {"to": 5, "from": 3}}	\N	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-12 10:36:10.042505
3e2fde28-1259-4a66-b052-0d595e5849e5	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	73a27423-facd-4e0d-b4e2-f50b17e117e3	UPDATED	{"isActive": {"to": false, "from": true}}	\N	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-12 11:22:35.962517
9b70c23a-e764-4060-9339-8b4728f79705	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	73a27423-facd-4e0d-b4e2-f50b17e117e3	UPDATED	{"isActive": {"to": true, "from": false}}	\N	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-12 11:48:17.181565
c201aac9-640a-4d81-9b60-973f6f214ebe	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	0b829499-376c-4934-848d-0c30ec647a69	CREATED	\N	{"code": "7622201764999", "name": "codigo de barras trident", "brand": "trigger", "quantity": 11, "unitPrice": 22}	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-16 11:27:32.315974
7d2b1e61-aba0-402d-8435-7dd9a8ce51ba	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	0b829499-376c-4934-848d-0c30ec647a69	UPDATED	{"quantity": {"to": 13, "from": 11}}	\N	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-16 11:32:33.783836
c4fdb3d5-e75e-4135-84c1-f3f5532832cf	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	c01b9ba8-b79c-4303-b41e-8f66ff21076b	UPDATED	{"unitPrice": {"to": 11, "from": "11.00"}}	\N	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-16 14:06:14.350005
\.


--
-- Data for Name: product_discount; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_discount (id, product_id, branch_id, company_id, discount_type, discount_value, is_active, start_date, end_date, created_at, updated_at) FROM stdin;
b8a858eb-6ca4-41aa-9e54-cc1f326af17b	73a27423-facd-4e0d-b4e2-f50b17e117e3	d67dcc35-dd4a-4355-9d08-da3a19796932	ff3f49aa-6a6f-4634-ba63-823f84d23d31	PERCENTAGE	20.00	t	2026-03-08 19:00:00	2026-03-09 19:00:00	2026-03-10 16:47:29.404445	2026-03-10 16:47:29.404445
93f5c2a2-27b2-4f9f-93b7-dd38e9a52b8b	c01b9ba8-b79c-4303-b41e-8f66ff21076b	d67dcc35-dd4a-4355-9d08-da3a19796932	ff3f49aa-6a6f-4634-ba63-823f84d23d31	FIXED_AMOUNT	1.00	t	2026-03-10 19:00:00	2026-03-13 19:00:00	2026-03-10 16:27:51.710851	2026-03-10 19:19:48.758
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, branch_id, code, name, category_id, subcategory_id, brand, unit_price, quantity, default_supplier_id, is_active, created_at, updated_at, description, created_by_user_id, views, company_id) FROM stdin;
bb54c357-4d9e-4b73-9827-dfdaaf775b76	de8015dd-7b85-48a0-ab93-87be7b427ee5	003	pruba de imagenes	5a76d03c-1ba1-4326-8d84-57aed3b42bdc	cbc83096-026e-49e3-a20a-a88c44ebd63f	trigger	12.00	4	f198d1e9-0962-4d67-b462-9ff475ddb5e9	t	2026-03-09 09:55:09.482489	2026-03-09 10:41:13.643021	Graduado/Alumno	874bf18a-38d4-4d89-a3fc-0e632363cd36	1	ff3f49aa-6a6f-4634-ba63-823f84d23d31
b2e27594-8197-4617-ab30-95aa26b22a9a	de8015dd-7b85-48a0-ab93-87be7b427ee5	7622201764999	codigo de barras trident	5a76d03c-1ba1-4326-8d84-57aed3b42bdc	e74291ba-8d7a-4cec-b5b3-0f0026898932	trigger	22.00	1	\N	t	2026-03-31 17:14:53.473334	2026-03-31 17:17:40.050536	testeo de autocompletado de qr	874bf18a-38d4-4d89-a3fc-0e632363cd36	0	ff3f49aa-6a6f-4634-ba63-823f84d23d31
73a27423-facd-4e0d-b4e2-f50b17e117e3	d67dcc35-dd4a-4355-9d08-da3a19796932	002	armazon de plastico	c7577e97-ec49-4e8b-8fc0-efa6725577b4	9abd7dc4-233e-4c05-827d-f6db1c54e3ac	trigger	10.00	0	40b45372-53e2-4f35-8ef1-de31d83700bd	t	2026-03-02 14:50:32.32481	2026-04-06 14:34:21.737308	Graduado/Alumno?	874bf18a-38d4-4d89-a3fc-0e632363cd36	12	ff3f49aa-6a6f-4634-ba63-823f84d23d31
0b829499-376c-4934-848d-0c30ec647a69	d67dcc35-dd4a-4355-9d08-da3a19796932	7622201764999	codigo de barras trident	c7577e97-ec49-4e8b-8fc0-efa6725577b4	9abd7dc4-233e-4c05-827d-f6db1c54e3ac	trigger	22.00	6	40b45372-53e2-4f35-8ef1-de31d83700bd	t	2026-03-16 11:27:32.245086	2026-04-06 16:18:27.968516	testeo de autocompletado de qr	874bf18a-38d4-4d89-a3fc-0e632363cd36	9	ff3f49aa-6a6f-4634-ba63-823f84d23d31
9c9fe253-bd97-4480-a552-8ba21a4ba17b	de8015dd-7b85-48a0-ab93-87be7b427ee5	001	armazon de metal	5a76d03c-1ba1-4326-8d84-57aed3b42bdc	cbc83096-026e-49e3-a20a-a88c44ebd63f	trigger	12.00	42	f198d1e9-0962-4d67-b462-9ff475ddb5e9	t	2026-03-05 16:40:56.906406	2026-03-16 14:49:52.290217	test	874bf18a-38d4-4d89-a3fc-0e632363cd36	11	ff3f49aa-6a6f-4634-ba63-823f84d23d31
c01b9ba8-b79c-4303-b41e-8f66ff21076b	d67dcc35-dd4a-4355-9d08-da3a19796932	001	armazon de metal	c7577e97-ec49-4e8b-8fc0-efa6725577b4	9abd7dc4-233e-4c05-827d-f6db1c54e3ac	rayban	11.00	4	40b45372-53e2-4f35-8ef1-de31d83700bd	t	2026-03-02 14:49:38.571377	2026-03-16 15:10:51.612257	Graduado/Alumno	874bf18a-38d4-4d89-a3fc-0e632363cd36	15	ff3f49aa-6a6f-4634-ba63-823f84d23d31
cc1efab3-f5e4-45ba-9ccc-67d4cc3a0e91	de8015dd-7b85-48a0-ab93-87be7b427ee5	002	armazon de plastico	5a76d03c-1ba1-4326-8d84-57aed3b42bdc	e74291ba-8d7a-4cec-b5b3-0f0026898932	trigger	10.00	5	\N	t	2026-03-09 10:40:19.102884	2026-03-16 15:23:05.402245	Graduado/Alumno?	874bf18a-38d4-4d89-a3fc-0e632363cd36	11	ff3f49aa-6a6f-4634-ba63-823f84d23d31
\.


--
-- Data for Name: purchase_order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchase_order_items (id, purchase_order_id, product_id, product_code, product_name, product_brand, quantity, unit_price, line_total, created_at, updated_at) FROM stdin;
6502abee-b6b7-4e74-b8d5-64a11072366b	928ec0dd-662a-4b96-aa16-d2f79ccb5697	0b829499-376c-4934-848d-0c30ec647a69	7622201764999	codigo de barras trident	trigger	2	22.00	44.00	2026-04-06 15:24:41.664282	2026-04-06 15:24:41.664282
0019dc0a-af63-42b2-bfdb-4afeeb1a2b0a	928ec0dd-662a-4b96-aa16-d2f79ccb5697	73a27423-facd-4e0d-b4e2-f50b17e117e3	002	armazon de plastico	trigger	1	10.00	10.00	2026-04-06 15:24:41.664282	2026-04-06 15:24:41.664282
82bdd362-1bb9-4c9d-8260-680bdbac8cfa	4b8b184d-085a-4093-92d5-0add30e02420	0b829499-376c-4934-848d-0c30ec647a69	7622201764999	codigo de barras trident	trigger	1	22.00	22.00	2026-04-06 15:24:41.664282	2026-04-06 15:24:41.664282
f49832bf-3e28-4725-bbcf-a62c108d956b	4b8b184d-085a-4093-92d5-0add30e02420	73a27423-facd-4e0d-b4e2-f50b17e117e3	002	armazon de plastico	trigger	1	10.00	10.00	2026-04-06 15:24:41.664282	2026-04-06 15:24:41.664282
ad13b5a3-3dfc-4158-8262-5482800a9e51	6b436f3f-2eea-4b9f-8a03-23cccac6f301	0b829499-376c-4934-848d-0c30ec647a69	7622201764999	codigo de barras trident	trigger	1	22.00	22.00	2026-04-06 16:18:28.075259	2026-04-06 16:18:28.075259
\.


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchase_orders (id, order_number, client_id, laboratory_order_id, company_id, branch_id, should_invoice, status, total_amount, created_at, updated_at) FROM stdin;
928ec0dd-662a-4b96-aa16-d2f79ccb5697	1	343770d0-ecfe-4d8e-93f9-d77b2e187f3f	ce6958b6-9634-4230-9fd9-b4bde2f6ab46	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	f	pending	54.00	2026-04-02 13:49:31.452204	2026-04-02 13:49:31.452204
4b8b184d-085a-4093-92d5-0add30e02420	2	e325341b-b990-4870-a0a5-de193e4075f1	88c8e7ed-b0d6-46c3-b01b-e9546332e5de	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	f	pending	32.00	2026-04-06 14:34:21.916525	2026-04-06 14:34:21.916525
6b436f3f-2eea-4b9f-8a03-23cccac6f301	3	c74d74c4-05a1-4dc8-bf73-e6a5e9fa9d2a	ad04f627-e8cc-4c5f-8ee0-4c7365d52e02	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	f	pending	22.00	2026-04-06 16:18:28.075259	2026-04-06 16:18:28.075259
\.


--
-- Data for Name: reminder_rules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reminder_rules (id, company_id, branch_id, is_active, appointment_reminder_hours_before, renewal_after_days, renewal_notify_before_days, quiet_hours_start, quiet_hours_end, created_at, updated_at) FROM stdin;
daccbdb3-b157-41a2-bc7b-be65273df5d9	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	t	24	365	5	21:00	08:00	2026-03-17 12:21:41.467787	2026-03-24 11:20:42.016187
\.


--
-- Data for Name: role_modules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_modules (role_id, module_id, is_enabled) FROM stdin;
a91698f8-d6d4-462e-80b0-a2fa0517e64f	c828ad37-33c9-4949-b99a-f8b8ff21a085	t
a91698f8-d6d4-462e-80b0-a2fa0517e64f	248bccd0-7d98-4e46-80df-11d8d22102eb	t
a91698f8-d6d4-462e-80b0-a2fa0517e64f	607b9108-9dfd-45a8-b75a-22c6974d7fd4	t
a91698f8-d6d4-462e-80b0-a2fa0517e64f	bdf9c4f6-e607-4bce-9f88-490ef5b65d36	t
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (role_id, permission_id, is_enabled) FROM stdin;
3cfb3f3f-42ed-479a-a9e8-0158473d3cdd	1d77ac5d-4342-49b6-8a91-3a120aab48cd	t
a91698f8-d6d4-462e-80b0-a2fa0517e64f	c69d4b40-0d45-43a7-abb9-e3195ffb382b	t
a91698f8-d6d4-462e-80b0-a2fa0517e64f	0ec24ecf-9cde-445c-afc7-dde23f7d7477	t
a91698f8-d6d4-462e-80b0-a2fa0517e64f	926be685-1920-4ca9-88e1-7ce82e2b51ee	t
a91698f8-d6d4-462e-80b0-a2fa0517e64f	3476e77d-5402-49f6-b9c5-29657cc6270f	t
a91698f8-d6d4-462e-80b0-a2fa0517e64f	66af3090-2664-4faf-8d76-302b6662da5e	t
a91698f8-d6d4-462e-80b0-a2fa0517e64f	54f13404-f1b1-4313-9351-8e979058bd28	t
a91698f8-d6d4-462e-80b0-a2fa0517e64f	bc60fcd8-791b-4371-8910-6f21b8baa446	t
a91698f8-d6d4-462e-80b0-a2fa0517e64f	58933118-495e-414e-95ba-1629a7e42de8	t
a91698f8-d6d4-462e-80b0-a2fa0517e64f	b960b6bd-de11-40c3-9a84-2e9fd44aad9c	t
a91698f8-d6d4-462e-80b0-a2fa0517e64f	7061e7e7-cc65-4017-b39c-0cb02ca6b8c6	t
a91698f8-d6d4-462e-80b0-a2fa0517e64f	0669f8b2-2296-436f-bbd1-650c587225ca	t
a91698f8-d6d4-462e-80b0-a2fa0517e64f	27b89d1b-68ad-4055-91ed-3475c4495a7a	t
a91698f8-d6d4-462e-80b0-a2fa0517e64f	b78c4b4d-aa1f-4157-b0f1-6a873219ebed	t
3cfb3f3f-42ed-479a-a9e8-0158473d3cdd	27b89d1b-68ad-4055-91ed-3475c4495a7a	t
3cfb3f3f-42ed-479a-a9e8-0158473d3cdd	c69d4b40-0d45-43a7-abb9-e3195ffb382b	t
3cfb3f3f-42ed-479a-a9e8-0158473d3cdd	0ec24ecf-9cde-445c-afc7-dde23f7d7477	t
3cfb3f3f-42ed-479a-a9e8-0158473d3cdd	926be685-1920-4ca9-88e1-7ce82e2b51ee	t
3cfb3f3f-42ed-479a-a9e8-0158473d3cdd	3476e77d-5402-49f6-b9c5-29657cc6270f	t
3cfb3f3f-42ed-479a-a9e8-0158473d3cdd	66af3090-2664-4faf-8d76-302b6662da5e	t
3cfb3f3f-42ed-479a-a9e8-0158473d3cdd	54f13404-f1b1-4313-9351-8e979058bd28	t
3cfb3f3f-42ed-479a-a9e8-0158473d3cdd	bc60fcd8-791b-4371-8910-6f21b8baa446	t
3cfb3f3f-42ed-479a-a9e8-0158473d3cdd	58933118-495e-414e-95ba-1629a7e42de8	t
3cfb3f3f-42ed-479a-a9e8-0158473d3cdd	b960b6bd-de11-40c3-9a84-2e9fd44aad9c	t
3cfb3f3f-42ed-479a-a9e8-0158473d3cdd	7061e7e7-cc65-4017-b39c-0cb02ca6b8c6	t
3cfb3f3f-42ed-479a-a9e8-0158473d3cdd	0669f8b2-2296-436f-bbd1-650c587225ca	t
3cfb3f3f-42ed-479a-a9e8-0158473d3cdd	b78c4b4d-aa1f-4157-b0f1-6a873219ebed	t
a91698f8-d6d4-462e-80b0-a2fa0517e64f	1d77ac5d-4342-49b6-8a91-3a120aab48cd	t
a91698f8-d6d4-462e-80b0-a2fa0517e64f	7ec21b5c-03fa-415c-b6de-59fea2dd2cea	t
3cfb3f3f-42ed-479a-a9e8-0158473d3cdd	7ec21b5c-03fa-415c-b6de-59fea2dd2cea	t
a91698f8-d6d4-462e-80b0-a2fa0517e64f	772ddd04-70cf-4d3c-b4a3-c30b18bf8505	t
3cfb3f3f-42ed-479a-a9e8-0158473d3cdd	772ddd04-70cf-4d3c-b4a3-c30b18bf8505	t
3cfb3f3f-42ed-479a-a9e8-0158473d3cdd	bb505d45-47d5-4205-acbc-88d8ce4287f4	t
a91698f8-d6d4-462e-80b0-a2fa0517e64f	bb505d45-47d5-4205-acbc-88d8ce4287f4	t
a91698f8-d6d4-462e-80b0-a2fa0517e64f	3a759a8f-544a-4625-875a-ffd38c44f577	t
3cfb3f3f-42ed-479a-a9e8-0158473d3cdd	3a759a8f-544a-4625-875a-ffd38c44f577	t
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, role_name, description, is_active, created_at, updated_at, company_id) FROM stdin;
a91698f8-d6d4-462e-80b0-a2fa0517e64f	SUPER_ADMIN	Super administrador del sistema con acceso a todas las empresas	t	2025-11-06 16:29:02.059965	2025-11-06 16:29:02.059965	\N
3cfb3f3f-42ed-479a-a9e8-0158473d3cdd	Admin-Sorti	es adminn	t	2025-11-11 17:08:29.998574	2025-11-18 12:14:04.98807	ff3f49aa-6a6f-4634-ba63-823f84d23d31
96e90d8b-3de8-4df2-a398-c7baed5b9a13	Ayudante	test	t	2026-03-31 16:38:45.732243	2026-03-31 16:38:45.732243	ff3f49aa-6a6f-4634-ba63-823f84d23d31
\.


--
-- Data for Name: shift_status; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shift_status (id, name, description, color, is_active, created_at, updated_at) FROM stdin;
4d0671f6-97cf-40fd-8811-005f5fd4d03e	Pendiente	Turno pendiente de confirmaci├│n	#ffc107	t	2025-09-23 14:06:54.417142	2025-09-23 14:06:54.417142
c50406f0-cee8-4926-876e-1b03bc985b9e	Confirmado	Turno confirmado	#28a745	t	2025-09-23 14:06:54.437691	2025-09-23 14:06:54.437691
fb7bc83f-99f7-4e07-adf6-1b3b3d494262	Cancelado	Turno cancelado	#dc3545	t	2025-09-23 14:06:54.4412	2025-09-23 14:06:54.4412
e43b5bac-cb6d-4552-8546-65f6db19c3ad	Finalizado	Turno finalizado	#0d6efd	t	2026-03-03 11:07:41.973861	2026-03-03 11:07:41.973861
\.


--
-- Data for Name: shifts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shifts (id, patient_id, branch_id, status_id, appointment_date, description, notes, created_at, updated_at, company_id) FROM stdin;
33d82a9e-9c6b-4f67-885e-3787eba4472a	3c383330-de98-4617-9b9d-b9406c92ed0b	d67dcc35-dd4a-4355-9d08-da3a19796932	e43b5bac-cb6d-4552-8546-65f6db19c3ad	2025-11-22 10:07:00	fgfgfg	\N	2025-11-18 10:07:03.656939	2026-03-03 11:21:10.854471	ff3f49aa-6a6f-4634-ba63-823f84d23d31
664c55b8-7d0f-4eb7-a3b1-bb1a9c40dddc	524d69f7-4784-4b78-af56-1c97223e7ef7	d67dcc35-dd4a-4355-9d08-da3a19796932	e43b5bac-cb6d-4552-8546-65f6db19c3ad	2025-11-22 15:02:00	pero con personam	\N	2025-11-17 15:03:19.831195	2026-03-03 11:43:03.784402	ff3f49aa-6a6f-4634-ba63-823f84d23d31
969800a4-60c0-40b0-af5f-40ea91980525	32f5a2a3-5758-4fb6-b4b6-ec55414942e7	d67dcc35-dd4a-4355-9d08-da3a19796932	4d0671f6-97cf-40fd-8811-005f5fd4d03e	2026-03-12 16:27:00		\N	2026-03-10 18:28:03.015245	2026-03-10 18:28:03.015245	ff3f49aa-6a6f-4634-ba63-823f84d23d31
92573199-81d4-4b4d-8129-d00f5fd4b144	32f5a2a3-5758-4fb6-b4b6-ec55414942e7	d67dcc35-dd4a-4355-9d08-da3a19796932	4d0671f6-97cf-40fd-8811-005f5fd4d03e	2026-03-30 16:14:00		\N	2026-03-27 16:14:14.79617	2026-03-27 16:14:14.79617	ff3f49aa-6a6f-4634-ba63-823f84d23d31
17ab1462-0940-4c39-af42-86e0fb972b8c	524d69f7-4784-4b78-af56-1c97223e7ef7	d67dcc35-dd4a-4355-9d08-da3a19796932	4d0671f6-97cf-40fd-8811-005f5fd4d03e	2026-03-30 16:14:00		\N	2026-03-27 16:14:23.380327	2026-03-27 16:14:23.380327	ff3f49aa-6a6f-4634-ba63-823f84d23d31
a5c9bccb-d432-4eef-b300-664f5f793f7d	3c383330-de98-4617-9b9d-b9406c92ed0b	d67dcc35-dd4a-4355-9d08-da3a19796932	4d0671f6-97cf-40fd-8811-005f5fd4d03e	2026-03-30 16:14:00		\N	2026-03-27 16:14:32.87578	2026-03-27 16:14:32.87578	ff3f49aa-6a6f-4634-ba63-823f84d23d31
85795f18-40ff-4442-8bc1-96e6f00876e4	515b43a4-1257-40b6-a23c-cc47c1ed3029	d67dcc35-dd4a-4355-9d08-da3a19796932	4d0671f6-97cf-40fd-8811-005f5fd4d03e	2026-03-30 16:15:00		\N	2026-03-27 16:15:24.114087	2026-03-27 16:15:24.114087	ff3f49aa-6a6f-4634-ba63-823f84d23d31
73172028-e174-497c-9532-5c9c79b7bc6a	32f5a2a3-5758-4fb6-b4b6-ec55414942e7	d67dcc35-dd4a-4355-9d08-da3a19796932	4d0671f6-97cf-40fd-8811-005f5fd4d03e	2026-04-09 17:23:00		\N	2026-03-31 17:24:14.714732	2026-03-31 17:24:14.714732	ff3f49aa-6a6f-4634-ba63-823f84d23d31
\.


--
-- Data for Name: stock_movements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_movements (id, company_id, branch_id, product_id, movement_type, quantity, balance_after, reference_type, reference_id, note, created_by_user_id, created_at) FROM stdin;
cd4b3163-d7c4-4dc3-a482-d36bf0ab3fd1	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	c01b9ba8-b79c-4303-b41e-8f66ff21076b	SALIDA_TRANSFERENCIA	1	10	TRANSFERENCIA	90e977c4-2a90-4d84-b74c-6c0ff8c1824a	paso de stock, envia tiene 11 y recibe tiene 33, al final tendria que haber 10 y 34	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-05 16:43:07.832972
67e7c66f-f281-427f-8a89-1ea66ff5c6bd	ff3f49aa-6a6f-4634-ba63-823f84d23d31	de8015dd-7b85-48a0-ab93-87be7b427ee5	9c9fe253-bd97-4480-a552-8ba21a4ba17b	INGRESO_TRANSFERENCIA	1	34	TRANSFERENCIA	90e977c4-2a90-4d84-b74c-6c0ff8c1824a	paso de stock, envia tiene 11 y recibe tiene 33, al final tendria que haber 10 y 34	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-05 16:43:07.832972
febabc8f-cf9a-4918-a80f-7abf98e55060	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	c01b9ba8-b79c-4303-b41e-8f66ff21076b	SALIDA_TRANSFERENCIA	9	1	TRANSFERENCIA	18faa4db-2388-4ed0-9a19-95b176632776	transfiero mas de lo que hay	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-05 16:49:21.981997
2b4435d6-6bbb-4767-a7a7-8da5c5132aad	ff3f49aa-6a6f-4634-ba63-823f84d23d31	de8015dd-7b85-48a0-ab93-87be7b427ee5	9c9fe253-bd97-4480-a552-8ba21a4ba17b	INGRESO_TRANSFERENCIA	9	43	TRANSFERENCIA	18faa4db-2388-4ed0-9a19-95b176632776	transfiero mas de lo que hay	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-05 16:49:21.981997
862add1c-89ef-4ce5-b534-2cbc99a54a13	ff3f49aa-6a6f-4634-ba63-823f84d23d31	de8015dd-7b85-48a0-ab93-87be7b427ee5	9c9fe253-bd97-4480-a552-8ba21a4ba17b	SALIDA_TRANSFERENCIA	13	30	TRANSFERENCIA	d8249bfc-a17c-4d1a-9489-4f00f93137b6	\N	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-05 18:56:20.544203
28c25547-8ec1-43b2-baaf-c603309d7fc4	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	c01b9ba8-b79c-4303-b41e-8f66ff21076b	INGRESO_TRANSFERENCIA	13	14	TRANSFERENCIA	d8249bfc-a17c-4d1a-9489-4f00f93137b6	\N	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-05 18:56:20.544203
7aa30b56-4cfe-407c-8181-fd9380e473e2	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	c01b9ba8-b79c-4303-b41e-8f66ff21076b	SALIDA_TRANSFERENCIA	4	10	TRANSFERENCIA	57e81ee1-7d7c-425e-9a1b-db85e284b466	el que envia le quedar├ín 10	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-06 10:22:17.928759
b35fde79-9d0d-4aa4-b45f-ed4111cd0613	ff3f49aa-6a6f-4634-ba63-823f84d23d31	de8015dd-7b85-48a0-ab93-87be7b427ee5	9c9fe253-bd97-4480-a552-8ba21a4ba17b	INGRESO_TRANSFERENCIA	4	34	TRANSFERENCIA	57e81ee1-7d7c-425e-9a1b-db85e284b466	el que envia le quedar├ín 10	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-06 10:22:17.928759
fd75f8f0-93bb-4099-a10b-33e992aa25dd	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	c01b9ba8-b79c-4303-b41e-8f66ff21076b	SALIDA_TRANSFERENCIA	5	5	TRANSFERENCIA	0fc2160f-dea5-409a-bf7c-32c03c41bd98	se envian 5 quedan 5	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-06 10:53:01.543636
0cd295e8-70d1-4453-b8af-29655489671e	ff3f49aa-6a6f-4634-ba63-823f84d23d31	de8015dd-7b85-48a0-ab93-87be7b427ee5	9c9fe253-bd97-4480-a552-8ba21a4ba17b	INGRESO_TRANSFERENCIA	5	39	TRANSFERENCIA	0fc2160f-dea5-409a-bf7c-32c03c41bd98	se envian 5 quedan 5	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-06 10:53:01.543636
ca859099-20dc-4d06-91c6-a077037bfd85	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	c01b9ba8-b79c-4303-b41e-8f66ff21076b	SALIDA_TRANSFERENCIA	1	4	TRANSFERENCIA	ce33000a-6fbd-4d39-baf4-a74bd4153add	se envian 3 quedan 2	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-06 11:11:51.87693
df58f02e-1334-489c-893d-721c614a281d	ff3f49aa-6a6f-4634-ba63-823f84d23d31	de8015dd-7b85-48a0-ab93-87be7b427ee5	9c9fe253-bd97-4480-a552-8ba21a4ba17b	INGRESO_TRANSFERENCIA	1	40	TRANSFERENCIA	ce33000a-6fbd-4d39-baf4-a74bd4153add	se envian 3 quedan 2	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-06 11:11:51.87693
af728317-5c9f-4d22-ab94-72a313f9338c	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	73a27423-facd-4e0d-b4e2-f50b17e117e3	SALIDA_TRANSFERENCIA	2	3	TRANSFERENCIA	58b3234e-d479-43bc-b1b2-724a4bf0cabd	envio 2, mequedan 3 y en la otra se debe crear	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-09 10:40:19.102884
9c854336-2942-4b93-bb71-6263d73e255d	ff3f49aa-6a6f-4634-ba63-823f84d23d31	de8015dd-7b85-48a0-ab93-87be7b427ee5	cc1efab3-f5e4-45ba-9ccc-67d4cc3a0e91	INGRESO_TRANSFERENCIA	2	2	TRANSFERENCIA	58b3234e-d479-43bc-b1b2-724a4bf0cabd	envio 2, mequedan 3 y en la otra se debe crear	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-09 10:40:19.102884
37c9723d-1f4a-498c-ba45-d42e0be87b7c	ff3f49aa-6a6f-4634-ba63-823f84d23d31	de8015dd-7b85-48a0-ab93-87be7b427ee5	9c9fe253-bd97-4480-a552-8ba21a4ba17b	INGRESO_AJUSTE_MANUAL	2	42	PRODUCT_UPDATE	9c9fe253-bd97-4480-a552-8ba21a4ba17b	Ajuste manual de stock: 40 -> 42	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-12 10:33:30.708807
fc4fb819-0d7d-44c2-8fc6-5db35816f9e6	ff3f49aa-6a6f-4634-ba63-823f84d23d31	de8015dd-7b85-48a0-ab93-87be7b427ee5	cc1efab3-f5e4-45ba-9ccc-67d4cc3a0e91	INGRESO_AJUSTE_MANUAL	1	3	PRODUCT_UPDATE	cc1efab3-f5e4-45ba-9ccc-67d4cc3a0e91	Ajuste manual de stock: 2 -> 3	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-12 10:35:57.467569
1b17f045-421e-43d4-8292-7179e97097f4	ff3f49aa-6a6f-4634-ba63-823f84d23d31	de8015dd-7b85-48a0-ab93-87be7b427ee5	cc1efab3-f5e4-45ba-9ccc-67d4cc3a0e91	INGRESO_AJUSTE_MANUAL	2	5	PRODUCT_UPDATE	cc1efab3-f5e4-45ba-9ccc-67d4cc3a0e91	Ajuste manual de stock: 3 -> 5	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-12 10:36:10.033404
cee2cd64-fec1-4533-afb0-2088388a693b	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	0b829499-376c-4934-848d-0c30ec647a69	STOCK_INICIAL	11	11	PRODUCT_CREATION	0b829499-376c-4934-848d-0c30ec647a69	\N	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-16 11:27:32.301552
acc2cecb-fa37-4a40-bcc7-ea412dc9280d	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	0b829499-376c-4934-848d-0c30ec647a69	INGRESO_AJUSTE_MANUAL	2	13	PRODUCT_UPDATE	0b829499-376c-4934-848d-0c30ec647a69	Ajuste manual de stock: 11 -> 13	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-16 11:32:33.776522
382705aa-1153-409d-8927-f8ec5944e391	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	0b829499-376c-4934-848d-0c30ec647a69	SALIDA_TRANSFERENCIA	3	10	TRANSFERENCIA	34727b88-86a3-471c-bb59-7a949e447e13	\N	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-31 17:14:53.473334
02460a77-1663-418e-b401-21064953802f	ff3f49aa-6a6f-4634-ba63-823f84d23d31	de8015dd-7b85-48a0-ab93-87be7b427ee5	b2e27594-8197-4617-ab30-95aa26b22a9a	INGRESO_TRANSFERENCIA	3	3	TRANSFERENCIA	34727b88-86a3-471c-bb59-7a949e447e13	\N	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-31 17:14:53.473334
07dc89b2-9024-4eda-bec3-942e4d064132	ff3f49aa-6a6f-4634-ba63-823f84d23d31	de8015dd-7b85-48a0-ab93-87be7b427ee5	b2e27594-8197-4617-ab30-95aa26b22a9a	SALIDA_TRANSFERENCIA	2	1	TRANSFERENCIA	36fd0e59-0064-4072-a0db-c206684cae01	\N	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-31 17:17:40.050536
f4252dcf-dbfa-44a3-bef2-20f11aaed3a4	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	0b829499-376c-4934-848d-0c30ec647a69	INGRESO_TRANSFERENCIA	2	12	TRANSFERENCIA	36fd0e59-0064-4072-a0db-c206684cae01	\N	874bf18a-38d4-4d89-a3fc-0e632363cd36	2026-03-31 17:17:40.050536
58d79121-146f-4886-a589-f448e09efa78	\N	d67dcc35-dd4a-4355-9d08-da3a19796932	0b829499-376c-4934-848d-0c30ec647a69	LABORATORY_ORDER_CREATE	2	10	LABORATORY_ORDER	8fcb9caf-14ff-4075-8cc7-656d73b53832	Order #6	\N	2026-04-01 11:51:54.891218
f79ccf05-9c0c-4146-ae69-3232389705ff	\N	d67dcc35-dd4a-4355-9d08-da3a19796932	73a27423-facd-4e0d-b4e2-f50b17e117e3	LABORATORY_ORDER_CREATE	3	2	LABORATORY_ORDER	8fcb9caf-14ff-4075-8cc7-656d73b53832	Order #6	\N	2026-04-01 11:51:54.891218
d37a3e18-f58f-4351-a1cf-fb1d60fc2021	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	0b829499-376c-4934-848d-0c30ec647a69	LABORATORY_ORDER_CREATE	2	8	LABORATORY_ORDER	ce6958b6-9634-4230-9fd9-b4bde2f6ab46	Order #7	\N	2026-04-02 13:49:31.217991
3ff81021-eb7f-4f59-8b1c-707b4511c341	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	73a27423-facd-4e0d-b4e2-f50b17e117e3	LABORATORY_ORDER_CREATE	1	1	LABORATORY_ORDER	ce6958b6-9634-4230-9fd9-b4bde2f6ab46	Order #7	\N	2026-04-02 13:49:31.217991
2fe8ff52-24a3-470b-a51b-9ff67e492485	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	0b829499-376c-4934-848d-0c30ec647a69	LABORATORY_ORDER_CREATE	1	7	LABORATORY_ORDER	88c8e7ed-b0d6-46c3-b01b-e9546332e5de	Order #8	\N	2026-04-06 14:34:21.737308
1d4ad614-2bb3-4fb4-b147-baa593f629ea	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	73a27423-facd-4e0d-b4e2-f50b17e117e3	LABORATORY_ORDER_CREATE	1	0	LABORATORY_ORDER	88c8e7ed-b0d6-46c3-b01b-e9546332e5de	Order #8	\N	2026-04-06 14:34:21.737308
44532209-f2ba-4686-837d-ab93b3aed47b	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	0b829499-376c-4934-848d-0c30ec647a69	LABORATORY_ORDER_CREATE	1	6	LABORATORY_ORDER	ad04f627-e8cc-4c5f-8ee0-4c7365d52e02	Order #9	\N	2026-04-06 16:18:27.968516
\.


--
-- Data for Name: subcategories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subcategories (id, branch_id, category_id, name, is_active, created_at, updated_at, description, company_id) FROM stdin;
9abd7dc4-233e-4c05-827d-f6db1c54e3ac	d67dcc35-dd4a-4355-9d08-da3a19796932	c7577e97-ec49-4e8b-8fc0-efa6725577b4	mujer	t	2026-03-02 14:48:20.03129	2026-03-02 14:48:20.03129	armazones de mujer	ff3f49aa-6a6f-4634-ba63-823f84d23d31
cbc83096-026e-49e3-a20a-a88c44ebd63f	de8015dd-7b85-48a0-ab93-87be7b427ee5	5a76d03c-1ba1-4326-8d84-57aed3b42bdc	mixtos	t	2026-03-05 16:39:07.349208	2026-03-05 16:39:07.349208	test	ff3f49aa-6a6f-4634-ba63-823f84d23d31
e74291ba-8d7a-4cec-b5b3-0f0026898932	de8015dd-7b85-48a0-ab93-87be7b427ee5	5a76d03c-1ba1-4326-8d84-57aed3b42bdc	mujer	t	2026-03-09 10:40:19.102884	2026-03-09 10:40:19.102884	armazones de mujer	ff3f49aa-6a6f-4634-ba63-823f84d23d31
0711ec63-30a3-49c9-a004-888401f78ab3	d67dcc35-dd4a-4355-9d08-da3a19796932	4d1620f3-63aa-423b-b27f-80aba96638a1	reflectivas	t	2026-03-31 17:11:00.462708	2026-03-31 17:11:00.462708	test	ff3f49aa-6a6f-4634-ba63-823f84d23d31
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.suppliers (id, branch_id, name, document_number, phone, email, is_active, created_at, updated_at, company_id, website, address, notes) FROM stdin;
f198d1e9-0962-4d67-b462-9ff475ddb5e9	de8015dd-7b85-48a0-ab93-87be7b427ee5	todin	sincedula	0000000000	prove@gmail.com	t	2026-03-05 16:40:25.771048	2026-03-05 16:40:25.771048	ff3f49aa-6a6f-4634-ba63-823f84d23d31	\N	\N	\N
40b45372-53e2-4f35-8ef1-de31d83700bd	d67dcc35-dd4a-4355-9d08-da3a19796932	optimas	1317392239	1317392239	provedor@gmail.com	t	2026-03-02 14:48:41.040496	2026-03-06 16:00:25.027708	ff3f49aa-6a6f-4634-ba63-823f84d23d31	optimas.com	Manta centro	este proveedor es nuevoo
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, email, first_name, last_name, password_hash, role_id, profile_photo, address, document_number, date_of_birth, home_phone, mobile_phone, is_active, is_locked, failed_login_attempts, last_login_at, created_at, updated_at, reset_token, reset_token_expiry, branch_id, company_id) FROM stdin;
0616d757-5e3d-462b-b3bd-7c3ec7ff8f20	fabri	fabriciozavala13@gmail.com	fabricio	zavala	$2b$10$v64YBAwlpnvQKQ8TzaWz7.BStrtZvqym55RduteTThZpF7hDxE8Eq	a91698f8-d6d4-462e-80b0-a2fa0517e64f	\N	montecristi	1317392239	2025-10-31 19:00:00	\N	0962766008	t	f	0	2026-04-06 12:47:11.036	2025-11-12 12:13:23.664103	2026-04-06 12:47:11.04091	\N	\N	d67dcc35-dd4a-4355-9d08-da3a19796932	\N
2ffaa977-a048-4e49-85fe-71a729afc550	irene	ire@gmail.com	ire	reyes	$2b$10$qpKXglQMsT8IFK7jyk2e6ed6v7weZ00GwYEpcDvqN8LxGBhPuUruS	3cfb3f3f-42ed-479a-a9e8-0158473d3cdd	\N	manta	1317392238	2026-03-06 19:00:00	\N	0998411681	t	f	0	2026-03-19 15:20:22.971	2026-03-19 11:15:28.709024	2026-03-19 15:20:22.978123	\N	\N	d67dcc35-dd4a-4355-9d08-da3a19796932	ff3f49aa-6a6f-4634-ba63-823f84d23d31
874bf18a-38d4-4d89-a3fc-0e632363cd36	sorti	sorti@gmail.com	sortiio	oficial	$2b$10$EI2kNmbNP/38fTfHetT6duheIKGMUkBEnbMWmPuD4wymfSN41CJVC	3cfb3f3f-42ed-479a-a9e8-0158473d3cdd	\N	manta	1231231231	2025-11-05 19:00:00	\N	0994283082	t	f	0	2026-04-06 15:46:07.189	2025-11-11 17:09:50.590796	2026-04-06 15:46:07.193387	\N	\N	d67dcc35-dd4a-4355-9d08-da3a19796932	ff3f49aa-6a6f-4634-ba63-823f84d23d31
c8f13189-4759-40ed-b8fe-e97ede4e0295	riden	ride@gmail.com	riden	cede├▒o	$2b$10$X2LZNZ0HnjLUVJFhpDD1J.HTgQCK2rv4ergQ/bhkFbp1JKd41680m	a91698f8-d6d4-462e-80b0-a2fa0517e64f	\N	urbirrios	1231231233	2025-11-06 19:00:00	\N	0994283082	t	f	0	2025-11-12 14:51:15.816	2025-11-12 12:07:08.20881	2026-03-18 18:42:16.801208	\N	\N	d67dcc35-dd4a-4355-9d08-da3a19796932	\N
bc0cb4e4-f0ca-45f1-8ca8-889d4d158b44	isabel	arsabel021@gmail.com	isabel	quijije	$2b$10$4H3W0zS1Fk7JGpVGoYWYW.Z9EdQBaVmOmebxsTTvRpTQRppuUDMEe	3cfb3f3f-42ed-479a-a9e8-0158473d3cdd	\N	manta	1231231234	2025-10-31 19:00:00	\N	0963682245	t	f	2	\N	2025-11-13 11:42:20.381309	2026-03-18 18:17:16.291524	\N	\N	d67dcc35-dd4a-4355-9d08-da3a19796932	\N
\.


--
-- Data for Name: whatsapp_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.whatsapp_sessions (id, company_id, branch_id, user_id, session_key, status, qr_code, connected_phone, last_connected_at, created_at, updated_at) FROM stdin;
df22a760-f4bd-4ab2-9826-be7b106c59fe	\N	d67dcc35-dd4a-4355-9d08-da3a19796932	0616d757-5e3d-462b-b3bd-7c3ec7ff8f20	a773a043-ef1a-4063-9632-9e182a49ea92	qr_ready	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQQAAAEECAYAAADOCEoKAAAAAklEQVR4AewaftIAABIASURBVO3BQY4jWbIgQVVH3P/KOrnwhYEoPJY3Gdn9ByZif7DWWn9crLXW7WKttW4Xa611u1hrrdsP/0Dlb6uYVL6p4lMqU8WkMlWcqLyqOFE5qThReadiUpkqJpW/rWJSmSomlaliUnlVMamcVEwqJxWTyt9WMV2stdbtYq21bhdrrXX74V+o+CaVpyomld+mcqLyhMpU8Urlm1SeUjlRmSp+m8qkMlVMKicqU8UrlaliUvltFd+kcnKx1lq3i7XWul2stdbth/+AyhMVn1I5qThRmSpeqZxUnKhMKlPFpPKq4gmVk4pJ5Z2KE5UTlb9N5YmKb1P5bSpPVDxxsdZat4u11rpdrLXW7Yf/URUnKpPKVDFVTCqvKj5RcaLylMo3VTylcqLyf43KVPGOyhMVk8r/uou11rpdrLXW7WKttW4//I9S+YTKVPGUylQxqUwVJxWTym9T+W0VJypPVUwqT1RMKlPFUxWTyonKVPG/7mKttW4Xa611u1hrrdsP/4GK31YxqUwVn6j421SmincqTlSeqHhK5QmVqeLbKk5UpooTlW+r+LaK33Sx1lq3i7XWul2stdbth39B5W9TmSomlaliUpkqJpVXFd+kMlVMKq8qJpWp4ptUXlWcVEwqU8WkMlVMKq8qnlCZKiaVqeKdikllqphUTlSmindU/qaLtda6Xay11u1irbVuF2utdfvhH1T8t1VMKicqU8WkMlW8UvlNKu+oTBWTylQxqTxR8amKk4pJ5dsqJpUTlanilcpU8YTKExX/bRdrrXW7WGut28Vaa91++AcqU8WJyn9bxbdVfKJiUpkqXqmcVJxUTCqTym9TeaLiKZWpYqo4UXmnYlKZKqaKSeVEZap4R2WqmFSeqJgu1lrrdrHWWreLtda62R88pHJS8ZTKScWJylQxqTxVMak8UTGpvFMxqUwVk8pUMamcVDyl8kTFpPJOxaTyiYpJ5b+tYlJ5p2JSeaLi5GKttW4Xa611u1hrrZv9wYdUTiomlVcVJypTxaTyRMU7KlPFpPJExbepTBVPqHxbxaQyVUwqT1WcqEwVk8q3VUwqU8VTKlPFpDJVTConFdPFWmvdLtZa63ax1lo3+4NfpjJVvKNyUnGiclLxSuWk4kTlpGJSeadiUvlExaTyqmJSOan4NpWp4hMqU8X/RSrfVDFdrLXW7WKttW4Xa611++E/oHJScaLyquKbKiaVdyqeUJkqJpWTilcqk8pUMal8m8o3qUwVT6lMFZPKJ1SeqphUnqiYVF5VnFRMKp+4WGut28Vaa90u1lrr9sN/oGJSeaLinYoTlScqJpVXFZ9QeULlVcUTFScqJxXvqDyhMlWcqDyl8kTFpDJVvKPyiYpJ5R2VE5Wp4hMXa611u1hrrdvFWmvd7A9eqDxRcaLyTsWJyknFpDJVvKMyVZyoTBWTyqcqnlCZKk5UXlU8oXJS8ZTKExWTyknFpPLbKiaVdyo+oXJSMV2stdbtYq21bhdrrXW7WGutm/3BQyonFZPKVPGOylRxojJVTCpTxSuVk4oTlani21Smiknlv61iUpkqJpV3Kk5UTiomlXcqnlCZKp5QeVUxqXxTxXSx1lq3i7XWul2stdbth/9AxSdUXlVMFd9UMam8U3GiMlVMKlPFpPKqYlI5UZkqTlSmilcqU8WkMlU8ofIplaniROWk4h2V31TxSuWk4kRlqji5WGut28Vaa90u1lrrZn/wkMpUcaIyVbxSmSomlW+qeEflN1W8o3JSMalMFd+mclJxojJVvFI5qZhUpopJ5VMVT6h8W8WJylTxxMVaa90u1lrrdrHWWjf7gxcqU8WkclJxovKpiidUpoqnVKaKT6i8UzGpnFR8m8pJxaQyVZyovFMxqfxtFZPKVPG3qUwVk8pJxXSx1lq3i7XWul2stdbth39B5RMqU8VTKpPKScWJyquKk4oTlaliUpkq3lGZKiaVSWWqOFF5VfGJim9T+UTFicqrikllqjhRmSo+pfKJipOLtda6Xay11u1irbVuP/wLFU+onKi8qphUpoonVD6lclLxCZV3KiaVqeJE5aTilcpUMalMKk9UvFMxqZxUPKHyjsonKiaVpyqmikllUvnExVpr3S7WWut2sdZatx++QGWqeEplqjhRmSqmihOVVypTxSdUpopJ5VMqJxWTym+rOFF5qmJSmVROKp6qmFQmld+mMlWcVEwqk8pUMV2stdbtYq21bhdrrXX74V9QmSqmihOVdyomlU+o/LdVnFS8ozJVTCpTxacqJpWTir+tYlL5NpWp4kTlExXfVjGpnFystdbtYq21bhdrrXW7WGut2w+/QOWk4pXKVPFNFZ9SmSqmiknlpOKVyonKVHGiMlX8X6DyiYpJ5aTilcoTFf9tKlPFVHFysdZat4u11rpdrLXW7Yd/oWJSmSqmihOVVxWTyknFpDJVPKXyCZVPVUwqU8WkMlWcqLxTMVWcqDxRMam8qphUpopvUnlVMamcVEwqU8Wk8k7FpHJSMalMFScXa611u1hrrdvFWmvd7A9eqEwVk8pJxVMqU8WkMlWcqJxU/G0q71RMKicV36ZyUvEJlXcqTlSeqJhUpopXKlPFicpJxaTyTsWk8k0V08Vaa90u1lrrdrHWWrcf/gWVk4oTlXcqJpUnVP42lZOKqWJSeaXym1TeqZhUJpWp4kRlqphUnqr4bRVPVJyonFS8UpkqTlQ+cbHWWreLtda6Xay11s3+4A2VqeLbVE4qPqHyTsWJylTx21SmihOVT1WcqEwVk8pUMak8VTGpnFRMKicVr1SmihOVqWJSeapiUpkqJpWpYlKZKqaLtda6Xay11u1irbVuP/wDlSdU/jaVJyr+NpWpYlJ5p2JS+W0qJxWTylQxqUwVk8pTFScq36YyVfw2lROVE5Wp4uRirbVuF2utdbtYa62b/cEbKicVk8pU8ZTKJypOVD5V8YTKOxWTylRxonJS8ZTKExWTyknFK5WTiknlpGJSeadiUpkqnlCZKp5SmSomlaniiYu11rpdrLXW7WKttW4//AOVk4pJ5QmVVxUnFZPKVHGi8k7FicqkMlWcVLyjMlVMKt+k8qrif53KScWk8pTK36TyquJE5UTlpGK6WGut28Vaa90u1lrrdrHWWrcf/kHFpDKpTBWTyknFUyonKk9UvKMyVUwqJyrfVnGi8kTFpyo+ofKqYlL5popJ5VXFicpU8YmKpyq+6WKttW4Xa611u1hrrdsP/0Dlm1R+W8WJyqTyquJE5RMVk8o7KicVT6h8quJE5aTiUxWTyknFUyqfUDlR+W0qJxXTxVpr3S7WWut2sdZatx/+hYonKp5SmSomlaniROUplZOKSeWkYlKZKl6pfKLiUypTxaTyCZWnKiaVJ1SeqphUpopJZao4UfmUyjddrLXW7WKttW4Xa611sz94oXJS8QmVdyomlZOKE5Vvq5hUpopJ5Z2KT6icVEwqn6qYVKaKE5VPVfw2lZOKSWWqOFH5VMWJylQxXay11u1irbVuF2utdfvhH1RMKpPKVPFExSuVJyomlanipOIplZOKSeUplScqpopJZVKZKl6pTBWTyjdVfEplqvi2ihOVqeJTFScqk8pU8cTFWmvdLtZa63ax1lq3H/6FiknlROXbKiaVE5UTlXcqflPFUyqTyhMVk8qnVKaKSeWk4h2VT6hMFU+pTBVTxaTyKZWp4qTiExdrrXW7WGut28Vaa91++AcqJxWTyhMV76hMFVPFpPJExSuVSWWqOFGZKk5Unqp4QuWk4pXKExUnFScq36YyVfw2laniRGWqeEdlqnii4uRirbVuF2utdbtYa62b/cELlScqTlSeqphUpopJZaqYVKaKd1SmiidUpoqnVKaKSeWJiknl2yomlZOKp1SmikllqnhKZap4QmWqmFT+toqTi7XWul2stdbtYq21bhdrrXX74R9UfFPFUypPVEwqT6mcqEwVJxWTyrdVPKHyv0blUypTxYnKVPFtFU9UvKPyRMWkMlVMF2utdbtYa63bxVpr3ewPHlI5qThReVXxN6m8qjhReaLiKZUnKiaVqeJE5dsqJpWTiqdUpopJ5aRiUnlVMan8pop3VKaKSeWJiulirbVuF2utdbtYa62b/cELlZOKSeWk4imVJyomlW+rmFSmiv91Kn9bxaQyVbxSmSpOVE4qTlTeqfiEylQxqbxTMak8UXFysdZat4u11rpdrLXWzf7ghcpJxSdUXlU8ofLbKiaVqeITKu9UTCpTxaRyUvGOylQxqTxRMan8t1W8o/JExYnKUxWTylRxonJSMV2stdbtYq21bhdrrXX74R9UnKicVEwqU8U7KlPFVDGpnFRMKp9S+UTFK5XfpPJOxaTyt1VMKlPFN6m8qnhCZap4ouKVylQxqUwVU8WkcnKx1lq3i7XWul2stdbN/uAhlaliUpkqJpVPVUwqf1vFpDJVTCrvVEwqU8UTKlPFpPJOxaTyTRXvqHyiYlKZKl6pnFScqJxUvKNyUnGiMlWcXKy11u1irbVuF2utdbM/eEPlpGJSOan4NpUnKl6pnFRMKlPFicpU8UrliYpvU5kqTlSmihOVdypOVE4qJpVPVUwqJxVPqHyqYlKZKk4u1lrrdrHWWreLtda6/fAvVHyTyjsVJyrfVvEJlSdUXlWcqHxC5Z2KSWWqeEJlqnhHZap4QmWqOFF5R2WqeEJlqniqYlI5qZhUporpYq21bhdrrXW7WGut28Vaa91++BdUpopJZaqYVKaKVyonKlPFpDJVTCrvqEwVk8pJxaTyt6lMFVPFpPJKZap4QmWqmFSeUjmpmFQmlaniUypTxUnFpDJVvFJ5QuWk4uRirbVuF2utdbtYa63bD/9AZaqYVKaKSWWqmFReVZxUnFScVEwqryo+oXJSMam8ozJVTCpTxaTyKZWTihOVqWJSeVUxqfymindUpooTlW9TmSpOVCaVqWK6WGut28Vaa90u1lrr9sMvqDipeKUyVUwqT1RMKp+qmFSmihOVd1SeqPi2iknlm1TeUZkqTlSmihOVqeKVyhMqU8WkMlVMKq8qJpVJZaqYKiaVk4u11rpdrLXW7WKttW4//IOKJ1S+TWWqmFSeqHhK5QmVqeKpiknlROWJindUpopJ5YmKE5WnVKaKT6i8qvimiknl21Q+cbHWWreLtda6Xay11s3+4IXKExWTylTxKZWTiknlqYonVKaKSeWk4pXKVDGpnFScqLxTMalMFU+onFR8SuWk4kTlnYoTlScqnlJ5ouKJi7XWul2stdbtYq21bvYHL1Q+UXGi8k7FicpJxaTyqYpPqHyqYlKZKiaVb6t4QmWqeEdlqjhR+UTFK5WTiknlb6s4UZkqTi7WWut2sdZat4u11rrZH/wPUnmiYlI5qXil8omKSWWqmFReVUwqU8WkMlVMKlPFUyq/qeIplf81FScqU8VTKicVJypTxXSx1lq3i7XWul2stdbth3+g8rdVnFRMKpPKScU7FZPKVPFNFe9U/CaVVxVPVJyoPKVyUvG3qfwmlVcVJxWTylTxxMVaa90u1lrrdrHWWreLtda6/fAvVHyTyrdVnKhMFa9UTlSmiidUpop3VJ5QeaLiqYonKk5UXlVMKp9QmSo+VTGpfKLiKZWp4qTi5GKttW4Xa611u1hrrdsP/wGVJyp+m8oTKq8qTlROVJ5QeVVxUnGicqLy21T+11RMKlPFK5UnKiaVE5VPVUwqU8WkMlVMF2utdbtYa63bxVpr3X74/1TFpDJVvFKZKqaKSWWqOFGZKl6pPKFyUjGpfErlExWTyiuVE5UnKk5U3qmYVJ6omFTeqZhUTio+cbHWWreLtda6Xay11u2H/1EVk8pUcaIyVUwqrypOVP6vUXmqYlL5RMWkMlW8UjmpmFSmiknlqYonKr5N5RMqT1ystdbtYq21bhdrrXX74T9Q8bdVnKhMFScVr1Smim+q+JTKVDGpnFRMKu9UfEJlqphU3qmYVKaKk4pJ5VMVk8oTFZPKOxWTyjddrLXW7WKttW4Xa611++FfUPnbVE4qpooTlXcqPqEyVTxVMamcqEwVk8qk8pTKVDGpTBWfqphUPqEyVUwqr1ROKqaKSWWqmFSmilcqT1ScqJxcrLXW7WKttW4Xa611sz9Ya60/LtZa63ax1lq3i7XWuv0/Z7o/DbxkyToAAAAASUVORK5CYII=	\N	\N	2026-04-01 09:53:07.757219	2026-04-01 10:14:29.336096
31ad52df-e894-48ed-b270-c34cf588f0cd	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	2ffaa977-a048-4e49-85fe-71a729afc550	3490ec6b-c205-4b4f-af3e-e1635e690fe8	connected	\N	\N	2026-03-19 12:30:16.883	2026-03-19 11:16:17.927416	2026-03-19 12:30:16.886919
65af0728-8d04-4d4b-a67f-dd23996f23ae	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	874bf18a-38d4-4d89-a3fc-0e632363cd36	3f0d7c68-3139-46ee-9282-453b1b8b1b83	qr_ready	data:image/png;base64,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	\N	2026-03-27 17:50:27.429	2026-03-17 12:21:41.561713	2026-04-02 14:34:04.652613
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.migrations_id_seq', 27, true);


--
-- Name: products PK_0806c755e0aca124e67c0cf6d7d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY (id);


--
-- Name: role_modules PK_0898417a9cc2d78e322076dc86a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_modules
    ADD CONSTRAINT "PK_0898417a9cc2d78e322076dc86a" PRIMARY KEY (role_id, module_id);


--
-- Name: shift_status PK_120976db1d22acde6cd67406e53; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_status
    ADD CONSTRAINT "PK_120976db1d22acde6cd67406e53" PRIMARY KEY (id);


--
-- Name: categories PK_24dbc6126a28ff948da33e97d3b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY (id);


--
-- Name: role_permissions PK_25d24010f53bb80b78e412c9656; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "PK_25d24010f53bb80b78e412c9656" PRIMARY KEY (role_id, permission_id);


--
-- Name: clinical_form_configs PK_2b869a35e7a49922535c242ab59; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_form_configs
    ADD CONSTRAINT "PK_2b869a35e7a49922535c242ab59" PRIMARY KEY (id);


--
-- Name: files PK_6c16b9093a142e0e7613b04a3d9; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY (id);


--
-- Name: subcategories PK_793ef34ad0a3f86f09d4837007c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT "PK_793ef34ad0a3f86f09d4837007c" PRIMARY KEY (id);


--
-- Name: modules PK_7dbefd488bd96c5bf31f0ce0c95; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT "PK_7dbefd488bd96c5bf31f0ce0c95" PRIMARY KEY (id);


--
-- Name: branches PK_7f37d3b42defea97f1df0d19535; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT "PK_7f37d3b42defea97f1df0d19535" PRIMARY KEY (id);


--
-- Name: shifts PK_84d692e367e4d6cdf045828768c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT "PK_84d692e367e4d6cdf045828768c" PRIMARY KEY (id);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: permissions PK_920331560282b8bd21bb02290df; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: patients PK_a7f0b9fcbb3469d5ec0b0aceaa7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT "PK_a7f0b9fcbb3469d5ec0b0aceaa7" PRIMARY KEY (id);


--
-- Name: laboratory_orders PK_af3dc5b9faaf79265b135b62c57; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laboratory_orders
    ADD CONSTRAINT "PK_af3dc5b9faaf79265b135b62c57" PRIMARY KEY (id);


--
-- Name: suppliers PK_b70ac51766a9e3144f778cfe81e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT "PK_b70ac51766a9e3144f778cfe81e" PRIMARY KEY (id);


--
-- Name: roles PK_c1433d71a4838793a49dcad46ab; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY (id);


--
-- Name: clinical_histories PK_cfb9612b30d2167eee2db3ea3d7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_histories
    ADD CONSTRAINT "PK_cfb9612b30d2167eee2db3ea3d7" PRIMARY KEY (id);


--
-- Name: client_patients PK_client_patients; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_patients
    ADD CONSTRAINT "PK_client_patients" PRIMARY KEY (client_id, patient_id);


--
-- Name: clients PK_clients_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT "PK_clients_id" PRIMARY KEY (id);


--
-- Name: companies PK_d4bc3e82a314fa9e29f652c2c22; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY (id);


--
-- Name: feedback PK_feedback; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT "PK_feedback" PRIMARY KEY (id);


--
-- Name: message_dispatch_logs PK_message_dispatch_logs; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_dispatch_logs
    ADD CONSTRAINT "PK_message_dispatch_logs" PRIMARY KEY (id);


--
-- Name: notification_campaigns PK_notification_campaigns; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_campaigns
    ADD CONSTRAINT "PK_notification_campaigns" PRIMARY KEY (id);


--
-- Name: patient_contact_preferences PK_patient_contact_preferences; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_contact_preferences
    ADD CONSTRAINT "PK_patient_contact_preferences" PRIMARY KEY (id);


--
-- Name: product_audit_log PK_product_audit_log; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_audit_log
    ADD CONSTRAINT "PK_product_audit_log" PRIMARY KEY (id);


--
-- Name: product_discount PK_product_discount; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_discount
    ADD CONSTRAINT "PK_product_discount" PRIMARY KEY (id);


--
-- Name: purchase_order_items PK_purchase_order_items; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT "PK_purchase_order_items" PRIMARY KEY (id);


--
-- Name: purchase_orders PK_purchase_orders_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT "PK_purchase_orders_id" PRIMARY KEY (id);


--
-- Name: reminder_rules PK_reminder_rules; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder_rules
    ADD CONSTRAINT "PK_reminder_rules" PRIMARY KEY (id);


--
-- Name: whatsapp_sessions PK_whatsapp_sessions; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_sessions
    ADD CONSTRAINT "PK_whatsapp_sessions" PRIMARY KEY (id);


--
-- Name: product_discount UNQ_product_discount_product_branch; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_discount
    ADD CONSTRAINT "UNQ_product_discount_product_branch" UNIQUE (product_id, branch_id);


--
-- Name: branches UQ_06583786d73e7325630a0278ff5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT "UQ_06583786d73e7325630a0278ff5" UNIQUE (code, company_id);


--
-- Name: shift_status UQ_0a6c37778b78276d4be6b514c62; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_status
    ADD CONSTRAINT "UQ_0a6c37778b78276d4be6b514c62" UNIQUE (name);


--
-- Name: companies UQ_3dacbb3eb4f095e29372ff8e131; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT "UQ_3dacbb3eb4f095e29372ff8e131" UNIQUE (name);


--
-- Name: users UQ_5f6c1b67ac12a1e7eb454a48e59; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_5f6c1b67ac12a1e7eb454a48e59" UNIQUE (document_number);


--
-- Name: patients UQ_64e2031265399f5690b0beba6a5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT "UQ_64e2031265399f5690b0beba6a5" UNIQUE (email);


--
-- Name: companies UQ_80af3e6808151c3210b4d5a2185; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT "UQ_80af3e6808151c3210b4d5a2185" UNIQUE (code);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: branches UQ_ac9b742f84958b3238d00ec8b3e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT "UQ_ac9b742f84958b3238d00ec8b3e" UNIQUE (name, company_id);


--
-- Name: modules UQ_e10bfbd4b8f0bdc8f363ab5757d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT "UQ_e10bfbd4b8f0bdc8f363ab5757d" UNIQUE (module_name);


--
-- Name: laboratory_orders UQ_f2de6591767f9e27c5f4a17adc9; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laboratory_orders
    ADD CONSTRAINT "UQ_f2de6591767f9e27c5f4a17adc9" UNIQUE (order_number);


--
-- Name: users UQ_fe0bb3f6520ee0469504521e710; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE (username);


--
-- Name: patient_contact_preferences UQ_patient_contact_preferences_scope; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_contact_preferences
    ADD CONSTRAINT "UQ_patient_contact_preferences_scope" UNIQUE (company_id, branch_id, patient_id);


--
-- Name: purchase_orders UQ_purchase_orders_laboratory_order_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT "UQ_purchase_orders_laboratory_order_id" UNIQUE (laboratory_order_id);


--
-- Name: purchase_orders UQ_purchase_orders_order_number; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT "UQ_purchase_orders_order_number" UNIQUE (order_number);


--
-- Name: reminder_rules UQ_reminder_rules_company_branch; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder_rules
    ADD CONSTRAINT "UQ_reminder_rules_company_branch" UNIQUE (company_id, branch_id);


--
-- Name: whatsapp_sessions UQ_whatsapp_sessions_company_branch_user; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_sessions
    ADD CONSTRAINT "UQ_whatsapp_sessions_company_branch_user" UNIQUE (company_id, branch_id, user_id);


--
-- Name: whatsapp_sessions UQ_whatsapp_sessions_session_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_sessions
    ADD CONSTRAINT "UQ_whatsapp_sessions_session_key" UNIQUE (session_key);


--
-- Name: inventory_transfers inventory_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transfers
    ADD CONSTRAINT inventory_transfers_pkey PRIMARY KEY (id);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- Name: IDX_29cd30f736e15404c03cb9d4b4; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_29cd30f736e15404c03cb9d4b4" ON public.clinical_form_configs USING btree (branch_id);


--
-- Name: IDX_2a4d50a7164d3e7b1f7831ed6f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_2a4d50a7164d3e7b1f7831ed6f" ON public.clinical_form_configs USING btree (company_id);


--
-- Name: IDX_31df4aa83afdccf17a6ec8e4a9; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_31df4aa83afdccf17a6ec8e4a9" ON public.laboratory_orders USING btree (attendance_date);


--
-- Name: IDX_4bccf5d81c7bd9ca9a8b8ea719; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4bccf5d81c7bd9ca9a8b8ea719" ON public.laboratory_orders USING btree (company_id);


--
-- Name: IDX_6a3fafa99b3f9c1e8aa7d5157a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_6a3fafa99b3f9c1e8aa7d5157a" ON public.clinical_histories USING btree (company_id);


--
-- Name: IDX_83bea396b44568c907b291c3eb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_83bea396b44568c907b291c3eb" ON public.laboratory_orders USING btree (branch_id);


--
-- Name: IDX_97d50f26dd5764039a2cbf2c30; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_97d50f26dd5764039a2cbf2c30" ON public.patients USING btree (company_id);


--
-- Name: IDX_9dba7bb491daa918b2934e662b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_9dba7bb491daa918b2934e662b" ON public.clinical_histories USING btree (branch_id, is_sent);


--
-- Name: IDX_a42dda88ae3a545b268e70af7a; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_a42dda88ae3a545b268e70af7a" ON public.patients USING btree (document_number, company_id);


--
-- Name: IDX_ab8c059582f2e2d67a8af7a861; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ab8c059582f2e2d67a8af7a861" ON public.clinical_histories USING btree (branch_id);


--
-- Name: IDX_b130332f65c0d02b75e3399b9c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_b130332f65c0d02b75e3399b9c" ON public.clinical_histories USING btree (patient_id);


--
-- Name: IDX_c4fc1b1cd80e7c55d359dd7813; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_c4fc1b1cd80e7c55d359dd7813" ON public.patients USING btree (branch_id);


--
-- Name: IDX_client_patients_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_client_patients_client_id" ON public.client_patients USING btree (client_id);


--
-- Name: IDX_client_patients_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_client_patients_patient_id" ON public.client_patients USING btree (patient_id);


--
-- Name: IDX_clients_branch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_clients_branch_id" ON public.clients USING btree (branch_id);


--
-- Name: IDX_clients_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_clients_company_id" ON public.clients USING btree (company_id);


--
-- Name: IDX_clients_document_number_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_clients_document_number_company_id" ON public.clients USING btree (document_number, company_id);


--
-- Name: IDX_clients_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_clients_patient_id" ON public.clients USING btree (patient_id);


--
-- Name: IDX_de9fd9baff94123ae2d2591fb3; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_de9fd9baff94123ae2d2591fb3" ON public.laboratory_orders USING btree (is_confirmed);


--
-- Name: IDX_f2de6591767f9e27c5f4a17adc; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_f2de6591767f9e27c5f4a17adc" ON public.laboratory_orders USING btree (order_number);


--
-- Name: IDX_fb2a10f94d1ac9600e76b910b0; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_fb2a10f94d1ac9600e76b910b0" ON public.laboratory_orders USING btree (patient_id);


--
-- Name: IDX_feedback_branch_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_feedback_branch_created" ON public.feedback USING btree (branch_id, created_at);


--
-- Name: IDX_feedback_branch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_feedback_branch_id" ON public.feedback USING btree (branch_id);


--
-- Name: IDX_feedback_company_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_feedback_company_created" ON public.feedback USING btree (company_id, created_at);


--
-- Name: IDX_feedback_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_feedback_company_id" ON public.feedback USING btree (company_id);


--
-- Name: IDX_feedback_created_by_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_feedback_created_by_user_id" ON public.feedback USING btree (created_by_user_id);


--
-- Name: IDX_feedback_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_feedback_status" ON public.feedback USING btree (status);


--
-- Name: IDX_feedback_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_feedback_type" ON public.feedback USING btree (type);


--
-- Name: IDX_laboratory_orders_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_laboratory_orders_client_id" ON public.laboratory_orders USING btree (client_id);


--
-- Name: IDX_laboratory_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_laboratory_orders_status" ON public.laboratory_orders USING btree (status);


--
-- Name: IDX_message_dispatch_logs_branch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_message_dispatch_logs_branch_id" ON public.message_dispatch_logs USING btree (branch_id);


--
-- Name: IDX_message_dispatch_logs_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_message_dispatch_logs_company_id" ON public.message_dispatch_logs USING btree (company_id);


--
-- Name: IDX_message_dispatch_logs_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_message_dispatch_logs_patient_id" ON public.message_dispatch_logs USING btree (patient_id);


--
-- Name: IDX_message_dispatch_logs_scheduled_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_message_dispatch_logs_scheduled_at" ON public.message_dispatch_logs USING btree (scheduled_at);


--
-- Name: IDX_message_dispatch_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_message_dispatch_logs_status" ON public.message_dispatch_logs USING btree (status);


--
-- Name: IDX_notification_campaigns_branch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_notification_campaigns_branch_id" ON public.notification_campaigns USING btree (branch_id);


--
-- Name: IDX_notification_campaigns_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_notification_campaigns_company_id" ON public.notification_campaigns USING btree (company_id);


--
-- Name: IDX_notification_campaigns_scheduled_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_notification_campaigns_scheduled_at" ON public.notification_campaigns USING btree (scheduled_at);


--
-- Name: IDX_notification_campaigns_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_notification_campaigns_status" ON public.notification_campaigns USING btree (status);


--
-- Name: IDX_patient_contact_preferences_branch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_patient_contact_preferences_branch_id" ON public.patient_contact_preferences USING btree (branch_id);


--
-- Name: IDX_patient_contact_preferences_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_patient_contact_preferences_company_id" ON public.patient_contact_preferences USING btree (company_id);


--
-- Name: IDX_patient_contact_preferences_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_patient_contact_preferences_patient_id" ON public.patient_contact_preferences USING btree (patient_id);


--
-- Name: IDX_product_audit_log_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_product_audit_log_created_at" ON public.product_audit_log USING btree (created_at DESC);


--
-- Name: IDX_product_audit_log_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_product_audit_log_event_type" ON public.product_audit_log USING btree (event_type);


--
-- Name: IDX_product_audit_log_product_branch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_product_audit_log_product_branch" ON public.product_audit_log USING btree (product_id, branch_id);


--
-- Name: IDX_product_discount_branch_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_product_discount_branch_active" ON public.product_discount USING btree (branch_id, is_active);


--
-- Name: IDX_product_discount_branch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_product_discount_branch_id" ON public.product_discount USING btree (branch_id);


--
-- Name: IDX_product_discount_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_product_discount_company_id" ON public.product_discount USING btree (company_id);


--
-- Name: IDX_product_discount_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_product_discount_is_active" ON public.product_discount USING btree (is_active);


--
-- Name: IDX_product_discount_product_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_product_discount_product_active" ON public.product_discount USING btree (product_id, is_active);


--
-- Name: IDX_product_discount_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_product_discount_product_id" ON public.product_discount USING btree (product_id);


--
-- Name: IDX_purchase_order_items_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_purchase_order_items_product_id" ON public.purchase_order_items USING btree (product_id);


--
-- Name: IDX_purchase_order_items_purchase_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_purchase_order_items_purchase_order_id" ON public.purchase_order_items USING btree (purchase_order_id);


--
-- Name: IDX_purchase_orders_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_purchase_orders_client_id" ON public.purchase_orders USING btree (client_id);


--
-- Name: IDX_purchase_orders_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_purchase_orders_company_id" ON public.purchase_orders USING btree (company_id);


--
-- Name: IDX_purchase_orders_laboratory_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_purchase_orders_laboratory_order_id" ON public.purchase_orders USING btree (laboratory_order_id);


--
-- Name: IDX_purchase_orders_order_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_purchase_orders_order_number" ON public.purchase_orders USING btree (order_number);


--
-- Name: IDX_purchase_orders_should_invoice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_purchase_orders_should_invoice" ON public.purchase_orders USING btree (should_invoice);


--
-- Name: IDX_purchase_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_purchase_orders_status" ON public.purchase_orders USING btree (status);


--
-- Name: IDX_reminder_rules_branch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_reminder_rules_branch_id" ON public.reminder_rules USING btree (branch_id);


--
-- Name: IDX_reminder_rules_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_reminder_rules_company_id" ON public.reminder_rules USING btree (company_id);


--
-- Name: IDX_whatsapp_sessions_branch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_whatsapp_sessions_branch_id" ON public.whatsapp_sessions USING btree (branch_id);


--
-- Name: IDX_whatsapp_sessions_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_whatsapp_sessions_company_id" ON public.whatsapp_sessions USING btree (company_id);


--
-- Name: IDX_whatsapp_sessions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_whatsapp_sessions_status" ON public.whatsapp_sessions USING btree (status);


--
-- Name: IDX_whatsapp_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_whatsapp_sessions_user_id" ON public.whatsapp_sessions USING btree (user_id);


--
-- Name: UQ_purchase_order_items_purchase_order_id_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_purchase_order_items_purchase_order_id_product_id" ON public.purchase_order_items USING btree (purchase_order_id, product_id);


--
-- Name: idx_inventory_transfers_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_transfers_company ON public.inventory_transfers USING btree (company_id);


--
-- Name: idx_inventory_transfers_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_transfers_created_at ON public.inventory_transfers USING btree (created_at);


--
-- Name: idx_inventory_transfers_source_branch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_transfers_source_branch ON public.inventory_transfers USING btree (source_branch_id);


--
-- Name: idx_inventory_transfers_source_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_transfers_source_product ON public.inventory_transfers USING btree (source_product_id);


--
-- Name: idx_inventory_transfers_target_branch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_transfers_target_branch ON public.inventory_transfers USING btree (target_branch_id);


--
-- Name: idx_inventory_transfers_target_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_transfers_target_product ON public.inventory_transfers USING btree (target_product_id);


--
-- Name: idx_stock_movements_branch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_movements_branch ON public.stock_movements USING btree (branch_id);


--
-- Name: idx_stock_movements_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_movements_company ON public.stock_movements USING btree (company_id);


--
-- Name: idx_stock_movements_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_movements_created_at ON public.stock_movements USING btree (created_at);


--
-- Name: idx_stock_movements_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_movements_product ON public.stock_movements USING btree (product_id);


--
-- Name: idx_stock_movements_reference; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_movements_reference ON public.stock_movements USING btree (reference_type, reference_id);


--
-- Name: idx_stock_movements_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_movements_type ON public.stock_movements USING btree (movement_type);


--
-- Name: ux_products_branch_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_products_branch_code ON public.products USING btree (branch_id, code);


--
-- Name: categories FK_0011937b9b4cd88d39accdd6edf; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "FK_0011937b9b4cd88d39accdd6edf" FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: role_modules FK_037d3081ebb1e33fa2b4204e057; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_modules
    ADD CONSTRAINT "FK_037d3081ebb1e33fa2b4204e057" FOREIGN KEY (module_id) REFERENCES public.modules(id);


--
-- Name: role_permissions FK_17022daf3f885f7d35423e9971e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY (permission_id) REFERENCES public.permissions(id);


--
-- Name: role_permissions FK_178199805b901ccd220ab7740ec; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: clinical_form_configs FK_29cd30f736e15404c03cb9d4b40; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_form_configs
    ADD CONSTRAINT "FK_29cd30f736e15404c03cb9d4b40" FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: clinical_form_configs FK_2a4d50a7164d3e7b1f7831ed6f7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_form_configs
    ADD CONSTRAINT "FK_2a4d50a7164d3e7b1f7831ed6f7" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: shifts FK_2c6e91d710e159b564af1a2d01b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT "FK_2c6e91d710e159b564af1a2d01b" FOREIGN KEY (status_id) REFERENCES public.shift_status(id);


--
-- Name: subcategories FK_3cd708752bf25e44862ccf4a61d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT "FK_3cd708752bf25e44862ccf4a61d" FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: products FK_3f105c75bd8de6544588ec76593; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_3f105c75bd8de6544588ec76593" FOREIGN KEY (default_supplier_id) REFERENCES public.suppliers(id);


--
-- Name: roles FK_4bc1204a05dde26383e3955b0a1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "FK_4bc1204a05dde26383e3955b0a1" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: laboratory_orders FK_4bccf5d81c7bd9ca9a8b8ea7193; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laboratory_orders
    ADD CONSTRAINT "FK_4bccf5d81c7bd9ca9a8b8ea7193" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: laboratory_orders FK_4fce6f548e7f997d20ce5f5274f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laboratory_orders
    ADD CONSTRAINT "FK_4fce6f548e7f997d20ce5f5274f" FOREIGN KEY (clinical_history_id) REFERENCES public.clinical_histories(id);


--
-- Name: branches FK_5973f79e64a27c506b07cd84b29; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT "FK_5973f79e64a27c506b07cd84b29" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: users FK_5a58f726a41264c8b3e86d4a1de; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_5a58f726a41264c8b3e86d4a1de" FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: subcategories FK_644a62f955dc1ffc058e16ed838; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT "FK_644a62f955dc1ffc058e16ed838" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: clinical_histories FK_6a3fafa99b3f9c1e8aa7d5157a1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_histories
    ADD CONSTRAINT "FK_6a3fafa99b3f9c1e8aa7d5157a1" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: suppliers FK_6a9681499416e80c1ffac4fe86c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT "FK_6a9681499416e80c1ffac4fe86c" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: permissions FK_738f46bb9ac6ea356f1915835d0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT "FK_738f46bb9ac6ea356f1915835d0" FOREIGN KEY (module_id) REFERENCES public.modules(id);


--
-- Name: users FK_7ae6334059289559722437bcc1c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_7ae6334059289559722437bcc1c" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: laboratory_orders FK_83bea396b44568c907b291c3eb3; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laboratory_orders
    ADD CONSTRAINT "FK_83bea396b44568c907b291c3eb3" FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: patients FK_97d50f26dd5764039a2cbf2c30b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT "FK_97d50f26dd5764039a2cbf2c30b" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: categories FK_987f987126a3f2e4f9ec03db04e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "FK_987f987126a3f2e4f9ec03db04e" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: products FK_9a5f6868c96e0069e699f33e124; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: laboratory_orders FK_a1206f47307aaebf2354974f9f8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laboratory_orders
    ADD CONSTRAINT "FK_a1206f47307aaebf2354974f9f8" FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: users FK_a2cecd1a3531c0b041e29ba46e1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: companies FK_a3dbf2085cb73fb94ddf2106ad4; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT "FK_a3dbf2085cb73fb94ddf2106ad4" FOREIGN KEY (logo_file_id) REFERENCES public.files(id);


--
-- Name: clinical_histories FK_ab8c059582f2e2d67a8af7a8612; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_histories
    ADD CONSTRAINT "FK_ab8c059582f2e2d67a8af7a8612" FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: clinical_histories FK_b130332f65c0d02b75e3399b9c8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_histories
    ADD CONSTRAINT "FK_b130332f65c0d02b75e3399b9c8" FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: products FK_b417f1726f6ccafb18730adffb0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_b417f1726f6ccafb18730adffb0" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: patients FK_c4fc1b1cd80e7c55d359dd78137; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT "FK_c4fc1b1cd80e7c55d359dd78137" FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: products FK_c9de3a8edea9269ca774c919b9a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_c9de3a8edea9269ca774c919b9a" FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id);


--
-- Name: shifts FK_cddc0af590dd113d6e5b6b530c8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT "FK_cddc0af590dd113d6e5b6b530c8" FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: suppliers FK_ce35fd787e09aecdb311aaff66c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT "FK_ce35fd787e09aecdb311aaff66c" FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: client_patients FK_client_patients_client_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_patients
    ADD CONSTRAINT "FK_client_patients_client_id" FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: client_patients FK_client_patients_patient_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_patients
    ADD CONSTRAINT "FK_client_patients_patient_id" FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: clients FK_clients_branch_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT "FK_clients_branch_id" FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: clients FK_clients_company_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT "FK_clients_company_id" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: clients FK_clients_patient_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT "FK_clients_patient_id" FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: products FK_d4131ec6fde82732ee2f3a777cd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_d4131ec6fde82732ee2f3a777cd" FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- Name: role_modules FK_d94c957204d1c78e702a97cc1a9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_modules
    ADD CONSTRAINT "FK_d94c957204d1c78e702a97cc1a9" FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: products FK_de720484cb95d8752861e507921; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_de720484cb95d8752861e507921" FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: shifts FK_dfcdd9987957c59812b920027e6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT "FK_dfcdd9987957c59812b920027e6" FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: shifts FK_e155f8dd2a50f91604c8d946369; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT "FK_e155f8dd2a50f91604c8d946369" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: subcategories FK_f7b015bc580ae5179ba5a4f42ec; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT "FK_f7b015bc580ae5179ba5a4f42ec" FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: laboratory_orders FK_fb2a10f94d1ac9600e76b910b0d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laboratory_orders
    ADD CONSTRAINT "FK_fb2a10f94d1ac9600e76b910b0d" FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: laboratory_orders FK_laboratory_orders_client_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laboratory_orders
    ADD CONSTRAINT "FK_laboratory_orders_client_id" FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: product_audit_log FK_product_audit_log_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_audit_log
    ADD CONSTRAINT "FK_product_audit_log_product" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_discount FK_product_discount_branch; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_discount
    ADD CONSTRAINT "FK_product_discount_branch" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: product_discount FK_product_discount_company; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_discount
    ADD CONSTRAINT "FK_product_discount_company" FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: product_discount FK_product_discount_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_discount
    ADD CONSTRAINT "FK_product_discount_product" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: purchase_order_items FK_purchase_order_items_purchase_order_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT "FK_purchase_order_items_purchase_order_id" FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


--
-- Name: purchase_orders FK_purchase_orders_branch_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT "FK_purchase_orders_branch_id" FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: purchase_orders FK_purchase_orders_client_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT "FK_purchase_orders_client_id" FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: purchase_orders FK_purchase_orders_company_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT "FK_purchase_orders_company_id" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: purchase_orders FK_purchase_orders_laboratory_order_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT "FK_purchase_orders_laboratory_order_id" FOREIGN KEY (laboratory_order_id) REFERENCES public.laboratory_orders(id);


--
-- Name: inventory_transfers fk_inventory_transfers_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transfers
    ADD CONSTRAINT fk_inventory_transfers_created_by FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: inventory_transfers fk_inventory_transfers_source_branch; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transfers
    ADD CONSTRAINT fk_inventory_transfers_source_branch FOREIGN KEY (source_branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT;


--
-- Name: inventory_transfers fk_inventory_transfers_source_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transfers
    ADD CONSTRAINT fk_inventory_transfers_source_product FOREIGN KEY (source_product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- Name: inventory_transfers fk_inventory_transfers_target_branch; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transfers
    ADD CONSTRAINT fk_inventory_transfers_target_branch FOREIGN KEY (target_branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT;


--
-- Name: inventory_transfers fk_inventory_transfers_target_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transfers
    ADD CONSTRAINT fk_inventory_transfers_target_product FOREIGN KEY (target_product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- Name: stock_movements fk_stock_movements_branch; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT fk_stock_movements_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT;


--
-- Name: stock_movements fk_stock_movements_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT fk_stock_movements_created_by FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: stock_movements fk_stock_movements_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT fk_stock_movements_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--



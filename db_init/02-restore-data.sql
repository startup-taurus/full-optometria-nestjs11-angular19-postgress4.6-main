--
-- PostgreSQL database dump
--

\restrict PSQ4bM8yVCPohHDZRz6smjmdNZP4Y9sCfrZZB0ukqKbHjUfw7QF9U0AgCaxzceb

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

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

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: laboratory_orders_frame_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.laboratory_orders_frame_type_enum AS ENUM (
    '3_piezas_al_aire',
    'ranurado_semiaire',
    'completo'
);


ALTER TYPE public.laboratory_orders_frame_type_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: branches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branches (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    code character varying NOT NULL,
    address character varying NOT NULL,
    city character varying NOT NULL,
    phone character varying,
    corporate_email character varying,
    opening_hours character varying,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    company_id uuid
);


ALTER TABLE public.branches OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: clinical_form_configs; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.clinical_form_configs OWNER TO postgres;

--
-- Name: clinical_histories; Type: TABLE; Schema: public; Owner: postgres
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
    company_id uuid
);


ALTER TABLE public.clinical_histories OWNER TO postgres;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
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
    phone character varying
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- Name: files; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.files OWNER TO postgres;

--
-- Name: laboratory_orders; Type: TABLE; Schema: public; Owner: postgres
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
    company_id uuid
);


ALTER TABLE public.laboratory_orders OWNER TO postgres;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.modules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    module_name character varying NOT NULL,
    description character varying,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.modules OWNER TO postgres;

--
-- Name: patients; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.patients OWNER TO postgres;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: role_modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_modules (
    role_id uuid NOT NULL,
    module_id uuid NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL
);


ALTER TABLE public.role_modules OWNER TO postgres;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: shift_status; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.shift_status OWNER TO postgres;

--
-- Name: shifts; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.shifts OWNER TO postgres;

--
-- Name: subcategories; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.subcategories OWNER TO postgres;

--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
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
    company_id uuid
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branches (id, name, code, address, city, phone, corporate_email, opening_hours, is_active, created_at, updated_at, company_id) FROM stdin;
d67dcc35-dd4a-4355-9d08-da3a19796932	Sorti-manta	1231231234	via san matheo	manta	1231231231	sorti@gmail.com	24/7	t	2025-11-11 17:09:09.560178	2025-11-11 17:09:09.560178	ff3f49aa-6a6f-4634-ba63-823f84d23d31
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, branch_id, name, is_active, created_at, updated_at, description, company_id) FROM stdin;
\.


--
-- Data for Name: clinical_form_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clinical_form_configs (id, branch_id, config_name, "fieldsConfig", is_active, version, created_at, updated_at, company_id) FROM stdin;
21a7007e-464d-4d09-be74-c5bf32f9f4dc	d67dcc35-dd4a-4355-9d08-da3a19796932	clinical_history_form	{"sections": {"step2_motorTests": {"fields": {"npa": true, "npc": true, "ductions": true, "versions": true, "coverTest": true, "stereopsis": true, "fusionalVergences": true}, "visible": true}, "step3_otherExams": {"fields": {"tonometry": true, "gonioscopy": true, "pachymetry": true, "biomicroscopy": true}, "visible": true}, "step2_keratometry": {"fields": {"keratometryOd": true, "keratometryOi": true}, "visible": true}, "step2_retinoscopy": {"fields": {"retinoscopyAxis": true, "retinoscopySphere": true, "retinoscopyCylinder": true}, "visible": true}, "step1_personalData": {"fields": {"height": true, "weight": true, "allergies": true, "occupation": true, "chiefComplaint": true, "currentMedications": true}, "visible": true}, "step3_ophthalmoscopy": {"fields": {"ophthalmoscopyOd": true, "ophthalmoscopyOi": true}, "visible": true}, "step3_refractiveTests": {"fields": {"keratometry": true, "retinoscopy": true, "autorefraction": true}, "visible": true}, "step2_visualAcuityNoRx": {"fields": {"visualAcuityOdVl": true, "visualAcuityOdVp": true, "visualAcuityOiVl": true, "visualAcuityOiVp": true}, "visible": true}, "step3_pupillaryReflexes": {"fields": {"directReflexOd": true, "directReflexOi": true, "consensualReflexOd": true, "consensualReflexOi": true}, "visible": true}, "step2_previousLensometry": {"fields": {"previousRxOd": true, "previousRxOi": true, "previousAddOd": true, "previousAddOi": true}, "visible": true}, "step2_visualAcuityWithRx": {"fields": {"correctedAvOdVl": true, "correctedAvOdVp": true, "correctedAvOiVl": true, "correctedAvOiVp": true}, "visible": true}, "step2_subjectiveRefraction": {"fields": {"subjectiveRxOdAdd": true, "subjectiveRxOiAdd": true, "subjectiveRxOdAxis": true, "subjectiveRxOiAxis": true, "subjectiveRxOdSphere": true, "subjectiveRxOiSphere": true, "subjectiveRxOdCylinder": true, "subjectiveRxOiCylinder": true}, "visible": true}, "step3_diagnosisAndDisposition": {"fields": {"followUp": true, "referral": true, "diagnosis": true, "treatment": true, "recommendations": true}, "visible": true}}}	t	1	2025-11-13 15:48:53.904843	2025-11-13 15:48:53.904843	\N
\.


--
-- Data for Name: clinical_histories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clinical_histories (id, branch_id, patient_id, professional_name, is_sent, last_visual_exam_date, vision_problems, general_health, other_health_problems, segment_anterior, previous_rx_od, previous_add_od, previous_rx_oi, previous_add_oi, visual_acuity_od_vl, visual_acuity_od_vp, visual_acuity_oi_vl, visual_acuity_oi_vp, "motorTest", final_rx_od_sphere, final_rx_od_cylinder, final_rx_od_axis, final_rx_od_add, final_rx_oi_sphere, final_rx_oi_cylinder, final_rx_oi_axis, final_rx_oi_add, corrected_av_od_vl, corrected_av_od_vp, corrected_av_oi_vl, corrected_av_oi_vp, "lensTypes", "pupillaryReflexes", ophthalmoscopy_od, ophthalmoscopy_oi, "refractiveTests", stereopsis, worth_test, other_notes, diagnosis, disposition, created_at, updated_at, occupation, first_time, segment_anterior_other, "additionalTreatments", company_id) FROM stdin;
dbb7de2b-0e35-4e62-871a-2dd7e5b9c1a3	d67dcc35-dd4a-4355-9d08-da3a19796932	524d69f7-4784-4b78-af56-1c97223e7ef7	test	t	2025-11-16 00:00:00	test	test			test	test	test	test	test	test	test	test	{"exophoria": {"od": "test", "oi": "test", "value": "", "applies": true}, "exotropia": {"od": "", "oi": "", "value": "", "applies": ""}, "endophoria": {"od": "", "oi": "", "value": "", "applies": ""}, "endotropia": {"od": "", "oi": "", "value": "", "applies": ""}, "hypotropia": {"od": "", "oi": "", "value": "", "applies": ""}, "alternating": {"od": "", "oi": "", "value": "", "applies": ""}, "hyperphoria": {"od": "", "oi": "", "value": "", "applies": ""}}	test			test	test			test	test	test	test	test	["acomodativos u ocupacionales"]	{"consensual": {"od": "test", "oi": "test"}, "photomotor": {"od": "test", "oi": "test"}, "accommodative": {"od": "test", "oi": "test"}}	test	test	{"refraction": {"od": "test", "oi": "test"}, "subjective": {"od": "test", "oi": "test"}, "autorefract": {"od": "test", "oi": "test"}, "keratometry": {"od": "test", "oi": "test"}}	test	test	test	test	test	2025-11-17 15:44:47.848145	2025-11-17 17:07:03.842802	test	f		["fotocromático", "filtro de luz azul", "antireflejo"]	ff3f49aa-6a6f-4634-ba63-823f84d23d31
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (id, name, code, is_active, created_at, updated_at, logo_file_id, email, phone) FROM stdin;
ff3f49aa-6a6f-4634-ba63-823f84d23d31	Sorti	1231231230	t	2025-11-11 17:08:19.816412	2025-11-12 10:33:55.524885	95976230-86ee-410f-97df-23328745620c	sorti@gmail.com	1231231230
\.


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: postgres
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
3ea5ceb0-ba30-4c9e-9a2d-0bd1df5138b8	31d1f549-f423-4cbf-b692-9f70f014f99b.jpg	istockphoto-1296205063-612x612.jpg	uploads/company/company_logo/31d1f549-f423-4cbf-b692-9f70f014f99b.jpg	19433	image/jpeg	company	ff3f49aa-6a6f-4634-ba63-823f84d23d31	company_logo	f	2025-11-11 17:08:19.881442	2025-11-12 10:33:55.473655	f
06c9dbb8-23ba-492a-90b9-3aa291cabe32	43bc7422-679a-410d-856e-bcf8429829d6.png	sorti.png	uploads/company/company_logo/43bc7422-679a-410d-856e-bcf8429829d6.png	8919	image/png	company	ff3f49aa-6a6f-4634-ba63-823f84d23d31	company_logo	f	2025-11-12 10:24:21.053679	2025-11-12 10:33:55.473655	f
41c4e88e-b7ab-4f1d-acd0-f831f6e3d763	db6f687b-f882-463b-a73f-0f651b16d240.jpeg	5414a2bf-6dca-461d-969c-22ab97b92045.jpeg	uploads/company/company_logo/db6f687b-f882-463b-a73f-0f651b16d240.jpeg	241824	image/jpeg	company	ff3f49aa-6a6f-4634-ba63-823f84d23d31	company_logo	f	2025-11-12 10:32:59.790905	2025-11-12 10:33:55.473655	f
95976230-86ee-410f-97df-23328745620c	4769a560-3eae-475b-b2fc-76d66220c31e.png	sorti.png	uploads/company/company_logo/4769a560-3eae-475b-b2fc-76d66220c31e.png	8919	image/png	company	ff3f49aa-6a6f-4634-ba63-823f84d23d31	company_logo	t	2025-11-12 10:33:55.476547	2025-11-12 10:33:55.476547	f
6dcfec65-5a64-4b81-b298-08186ec81c87	b22ec9ab-cdbe-42c2-b653-7d9d2f9db5b6.jpg	jost.jpg	uploads/patient/profile_photo/b22ec9ab-cdbe-42c2-b653-7d9d2f9db5b6.jpg	70464	image/jpeg	patient	524d69f7-4784-4b78-af56-1c97223e7ef7	profile_photo	f	2025-11-14 11:26:04.635117	2025-11-17 11:26:17.821672	f
f44f08bf-f6f1-48e2-978d-4573bae57c9e	af7f4c54-0d74-4ce4-b0f7-afc3fda1f699.png	ofta.png	uploads/patient/profile_photo/af7f4c54-0d74-4ce4-b0f7-afc3fda1f699.png	38717	image/png	patient	524d69f7-4784-4b78-af56-1c97223e7ef7	profile_photo	f	2025-11-14 11:38:10.083793	2025-11-17 11:26:17.821672	f
82913553-a284-42ab-9001-8e685a3c57b0	a4818db8-f194-405b-835d-9084ae4bd8c1.jpg	jost.jpg	uploads/patient/profile_photo/a4818db8-f194-405b-835d-9084ae4bd8c1.jpg	70464	image/jpeg	patient	524d69f7-4784-4b78-af56-1c97223e7ef7	profile_photo	t	2025-11-17 11:26:17.828134	2025-11-17 11:26:17.828134	f
\.


--
-- Data for Name: laboratory_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.laboratory_orders (id, branch_id, patient_id, clinical_history_id, attendance_date, delivery_date, od_sphere, od_cylinder, od_axis, od_add, od_height, od_dnp, oi_sphere, oi_cylinder, oi_axis, oi_add, oi_height, oi_dnp, d_vertex, pantos, panora, frame_fit, profile, mid, dist_vp, engraving, product_id, frame_type, frame_type_description, frame_brand, frame_model, frame_data, frame_larger_diameter, frame_horizontal, frame_vertical, frame_bridge, observations, is_confirmed, created_at, updated_at, order_number, cbase, sun_degree, prism, base, company_id) FROM stdin;
52599b80-3cec-4413-9d69-2bdbc2fc8bb5	d67dcc35-dd4a-4355-9d08-da3a19796932	524d69f7-4784-4b78-af56-1c97223e7ef7	dbb7de2b-0e35-4e62-871a-2dd7e5b9c1a3	2025-11-17	2025-11-29	test	test	test	test	test	test	test	test	test	test	test	test	test	test	test	test	test	test	test	test	\N	completo	\N	\N	\N	test	test	test	test	test	testt	f	2025-11-17 17:07:03.82243	2025-11-17 17:13:21.143911	1	test	test	test	test	ff3f49aa-6a6f-4634-ba63-823f84d23d31
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
\.


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.modules (id, module_name, description, is_active, created_at, updated_at) FROM stdin;
3256d577-9660-49c3-b0d4-d8e40fed5e70	Dashboard	Este es el modulo de Dashboard	t	2025-08-21 13:37:32.94191	2025-08-21 13:37:32.94191
a51560f7-474b-45f6-9bb5-cd63d215f7c3	Usuarios	Este es el modulo de Usuarios	t	2025-08-26 16:06:49.551012	2025-08-26 16:06:49.551012
f915e55d-b226-4431-89c2-77d43bfc19bd	Roles-Permisos	Este es el modulo de Roles y permisos	t	2025-08-26 16:09:28.431926	2025-08-26 16:09:28.431926
0c231748-9f78-40ec-a6ea-7cbac55bfe93	Inventario	Este modulo es sobre el inventario de la optica	t	2025-09-02 12:09:10.143798	2025-09-02 12:09:10.143798
6dd05ec4-d197-49f5-bdfc-2ba2d49e1531	Historial Clinico	Modulo para ver el historial del paciente	t	2025-09-02 16:59:17.577641	2025-09-02 16:59:17.577641
dc862858-58c6-47c3-997e-a16d77c8b891	Gestión de turnos	Este modulo contiene la gestion de los turnos	t	2025-09-03 09:33:14.051808	2025-09-03 09:33:14.051808
1ba0cc8d-774d-4563-a371-8560fe0b65dd	Sucursales	Este modulo contiene las sucursales	t	2025-09-03 14:38:58.024395	2025-09-03 14:38:58.024395
6830335e-90e4-4114-812f-51e5e50a2b02	Calendario	Este modulo es sobre el calendario de citas medicas	t	2025-09-03 15:58:36.191856	2025-09-03 15:58:36.191856
a657f1e6-2763-4279-a707-a00fd0dcad8e	Ordenes de laboratorio	este modulo contiene todas las ordenes del laboratorio	t	2025-09-09 10:21:47.658482	2025-09-09 10:21:47.658482
ea30afaa-a177-46d7-8263-28e2657658f8	Proveedores	Este modulo es para gestionar los proveedores	t	2025-09-16 09:17:39.703833	2025-09-16 09:17:39.703833
31f2d12e-877d-4090-a282-9f3f57b17aec	Categorias	modulo de categorias	t	2025-09-16 11:09:54.868459	2025-09-16 11:09:54.868459
5c6ebc55-f3f9-41db-a949-df38d941b510	Filtro de sucursales	sirve para cambiar entre sucursales del sistema	t	2025-10-27 14:06:57.893402	2025-10-27 14:06:57.893402
c2b2463b-1c97-43e6-b904-054dffbed1f4	Pacientes	Modulo que administra los pacientes del sistema	t	2025-11-14 09:43:06.873839	2025-11-14 09:43:06.873839
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patients (id, first_name, last_name, email, document_number, company_id, branch_id, date_of_birth, address, home_phone, mobile_phone, profile_photo, is_active, created_at, updated_at) FROM stdin;
524d69f7-4784-4b78-af56-1c97223e7ef7	jostinm	bajana	jostin12@gmail.com	1231231235	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	2001-11-07 19:00:00	paolas	123123	1231231233	/uploads/patient/profile_photo/a4818db8-f194-405b-835d-9084ae4bd8c1.jpg	t	2025-11-14 11:26:04.596024	2025-11-17 15:33:47.347976
3c383330-de98-4617-9b9d-b9406c92ed0b	mark	proañoo	mark@gmail.com	1231231234	ff3f49aa-6a6f-4634-ba63-823f84d23d31	d67dcc35-dd4a-4355-9d08-da3a19796932	2025-11-01 19:00:00	las cumbres	123123	1231231231	\N	t	2025-11-14 10:51:26.423804	2025-11-18 12:12:32.177527
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
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
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, branch_id, code, name, category_id, subcategory_id, brand, unit_price, quantity, default_supplier_id, is_active, created_at, updated_at, description, created_by_user_id, views, company_id) FROM stdin;
\.


--
-- Data for Name: role_modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_modules (role_id, module_id, is_enabled) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (role_id, permission_id, is_enabled) FROM stdin;
a91698f8-d6d4-462e-80b0-a2fa0517e64f	1d77ac5d-4342-49b6-8a91-3a120aab48cd	t
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
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, role_name, description, is_active, created_at, updated_at, company_id) FROM stdin;
a91698f8-d6d4-462e-80b0-a2fa0517e64f	SUPER_ADMIN	Super administrador del sistema con acceso a todas las empresas	t	2025-11-06 16:29:02.059965	2025-11-06 16:29:02.059965	\N
3cfb3f3f-42ed-479a-a9e8-0158473d3cdd	Admin-Sorti	es adminn	t	2025-11-11 17:08:29.998574	2025-11-18 12:14:04.98807	ff3f49aa-6a6f-4634-ba63-823f84d23d31
\.


--
-- Data for Name: shift_status; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shift_status (id, name, description, color, is_active, created_at, updated_at) FROM stdin;
4d0671f6-97cf-40fd-8811-005f5fd4d03e	Pendiente	Turno pendiente de confirmación	#ffc107	t	2025-09-23 14:06:54.417142	2025-09-23 14:06:54.417142
c50406f0-cee8-4926-876e-1b03bc985b9e	Confirmado	Turno confirmado	#28a745	t	2025-09-23 14:06:54.437691	2025-09-23 14:06:54.437691
fb7bc83f-99f7-4e07-adf6-1b3b3d494262	Cancelado	Turno cancelado	#dc3545	t	2025-09-23 14:06:54.4412	2025-09-23 14:06:54.4412
\.


--
-- Data for Name: shifts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shifts (id, patient_id, branch_id, status_id, appointment_date, description, notes, created_at, updated_at, company_id) FROM stdin;
664c55b8-7d0f-4eb7-a3b1-bb1a9c40dddc	524d69f7-4784-4b78-af56-1c97223e7ef7	d67dcc35-dd4a-4355-9d08-da3a19796932	4d0671f6-97cf-40fd-8811-005f5fd4d03e	2025-11-22 15:02:00	pero con personam	\N	2025-11-17 15:03:19.831195	2025-11-18 09:47:15.203857	ff3f49aa-6a6f-4634-ba63-823f84d23d31
33d82a9e-9c6b-4f67-885e-3787eba4472a	3c383330-de98-4617-9b9d-b9406c92ed0b	d67dcc35-dd4a-4355-9d08-da3a19796932	4d0671f6-97cf-40fd-8811-005f5fd4d03e	2025-11-22 10:07:00	fgfgfg	\N	2025-11-18 10:07:03.656939	2025-11-18 10:07:03.656939	ff3f49aa-6a6f-4634-ba63-823f84d23d31
\.


--
-- Data for Name: subcategories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subcategories (id, branch_id, category_id, name, is_active, created_at, updated_at, description, company_id) FROM stdin;
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suppliers (id, branch_id, name, document_number, phone, email, is_active, created_at, updated_at, company_id) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, first_name, last_name, password_hash, role_id, profile_photo, address, document_number, date_of_birth, home_phone, mobile_phone, is_active, is_locked, failed_login_attempts, last_login_at, created_at, updated_at, reset_token, reset_token_expiry, branch_id, company_id) FROM stdin;
bc0cb4e4-f0ca-45f1-8ca8-889d4d158b44	isabel	arsabel021@gmail.com	isabel	quijije	$2b$10$4H3W0zS1Fk7JGpVGoYWYW.Z9EdQBaVmOmebxsTTvRpTQRppuUDMEe	3cfb3f3f-42ed-479a-a9e8-0158473d3cdd	\N	manta	1231231234	2025-10-31 19:00:00	\N	0963682245	t	f	0	\N	2025-11-13 11:42:20.381309	2025-11-13 11:42:20.381309	\N	\N	d67dcc35-dd4a-4355-9d08-da3a19796932	\N
c8f13189-4759-40ed-b8fe-e97ede4e0295	riden	ride@gmail.com	riden	cedeño	$2b$10$X2LZNZ0HnjLUVJFhpDD1J.HTgQCK2rv4ergQ/bhkFbp1JKd41680m	a91698f8-d6d4-462e-80b0-a2fa0517e64f	\N	urbirrios	1231231233	2025-11-06 19:00:00	\N	0994283082	t	f	1	2025-11-12 14:51:15.816	2025-11-12 12:07:08.20881	2025-11-12 16:24:30.507501	\N	\N	d67dcc35-dd4a-4355-9d08-da3a19796932	\N
874bf18a-38d4-4d89-a3fc-0e632363cd36	sorti	sorti@gmail.com	sortiio	oficial	$2b$10$EI2kNmbNP/38fTfHetT6duheIKGMUkBEnbMWmPuD4wymfSN41CJVC	3cfb3f3f-42ed-479a-a9e8-0158473d3cdd	\N	manta	1231231231	2025-11-05 19:00:00	\N	1231231231	t	f	0	2025-12-10 14:24:53.215	2025-11-11 17:09:50.590796	2025-12-10 14:24:53.218257	\N	\N	d67dcc35-dd4a-4355-9d08-da3a19796932	ff3f49aa-6a6f-4634-ba63-823f84d23d31
0616d757-5e3d-462b-b3bd-7c3ec7ff8f20	fabri	fabriciozavala13@gmail.com	fabricio	zavala	$2b$10$v64YBAwlpnvQKQ8TzaWz7.BStrtZvqym55RduteTThZpF7hDxE8Eq	a91698f8-d6d4-462e-80b0-a2fa0517e64f	\N	montecristi	1317392239	2025-10-31 19:00:00	\N	0962766008	t	f	0	2025-12-10 14:52:52.577	2025-11-12 12:13:23.664103	2025-12-10 14:52:52.579399	\N	\N	d67dcc35-dd4a-4355-9d08-da3a19796932	\N
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migrations_id_seq', 1, false);


--
-- Name: products PK_0806c755e0aca124e67c0cf6d7d; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY (id);


--
-- Name: role_modules PK_0898417a9cc2d78e322076dc86a; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_modules
    ADD CONSTRAINT "PK_0898417a9cc2d78e322076dc86a" PRIMARY KEY (role_id, module_id);


--
-- Name: shift_status PK_120976db1d22acde6cd67406e53; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_status
    ADD CONSTRAINT "PK_120976db1d22acde6cd67406e53" PRIMARY KEY (id);


--
-- Name: categories PK_24dbc6126a28ff948da33e97d3b; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY (id);


--
-- Name: role_permissions PK_25d24010f53bb80b78e412c9656; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "PK_25d24010f53bb80b78e412c9656" PRIMARY KEY (role_id, permission_id);


--
-- Name: clinical_form_configs PK_2b869a35e7a49922535c242ab59; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinical_form_configs
    ADD CONSTRAINT "PK_2b869a35e7a49922535c242ab59" PRIMARY KEY (id);


--
-- Name: files PK_6c16b9093a142e0e7613b04a3d9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY (id);


--
-- Name: subcategories PK_793ef34ad0a3f86f09d4837007c; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT "PK_793ef34ad0a3f86f09d4837007c" PRIMARY KEY (id);


--
-- Name: modules PK_7dbefd488bd96c5bf31f0ce0c95; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT "PK_7dbefd488bd96c5bf31f0ce0c95" PRIMARY KEY (id);


--
-- Name: branches PK_7f37d3b42defea97f1df0d19535; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT "PK_7f37d3b42defea97f1df0d19535" PRIMARY KEY (id);


--
-- Name: shifts PK_84d692e367e4d6cdf045828768c; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT "PK_84d692e367e4d6cdf045828768c" PRIMARY KEY (id);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: permissions PK_920331560282b8bd21bb02290df; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: patients PK_a7f0b9fcbb3469d5ec0b0aceaa7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT "PK_a7f0b9fcbb3469d5ec0b0aceaa7" PRIMARY KEY (id);


--
-- Name: laboratory_orders PK_af3dc5b9faaf79265b135b62c57; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laboratory_orders
    ADD CONSTRAINT "PK_af3dc5b9faaf79265b135b62c57" PRIMARY KEY (id);


--
-- Name: suppliers PK_b70ac51766a9e3144f778cfe81e; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT "PK_b70ac51766a9e3144f778cfe81e" PRIMARY KEY (id);


--
-- Name: roles PK_c1433d71a4838793a49dcad46ab; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY (id);


--
-- Name: clinical_histories PK_cfb9612b30d2167eee2db3ea3d7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinical_histories
    ADD CONSTRAINT "PK_cfb9612b30d2167eee2db3ea3d7" PRIMARY KEY (id);


--
-- Name: companies PK_d4bc3e82a314fa9e29f652c2c22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY (id);


--
-- Name: branches UQ_06583786d73e7325630a0278ff5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT "UQ_06583786d73e7325630a0278ff5" UNIQUE (code, company_id);


--
-- Name: shift_status UQ_0a6c37778b78276d4be6b514c62; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_status
    ADD CONSTRAINT "UQ_0a6c37778b78276d4be6b514c62" UNIQUE (name);


--
-- Name: companies UQ_3dacbb3eb4f095e29372ff8e131; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT "UQ_3dacbb3eb4f095e29372ff8e131" UNIQUE (name);


--
-- Name: users UQ_5f6c1b67ac12a1e7eb454a48e59; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_5f6c1b67ac12a1e7eb454a48e59" UNIQUE (document_number);


--
-- Name: patients UQ_64e2031265399f5690b0beba6a5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT "UQ_64e2031265399f5690b0beba6a5" UNIQUE (email);


--
-- Name: companies UQ_80af3e6808151c3210b4d5a2185; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT "UQ_80af3e6808151c3210b4d5a2185" UNIQUE (code);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: branches UQ_ac9b742f84958b3238d00ec8b3e; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT "UQ_ac9b742f84958b3238d00ec8b3e" UNIQUE (name, company_id);


--
-- Name: modules UQ_e10bfbd4b8f0bdc8f363ab5757d; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT "UQ_e10bfbd4b8f0bdc8f363ab5757d" UNIQUE (module_name);


--
-- Name: laboratory_orders UQ_f2de6591767f9e27c5f4a17adc9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laboratory_orders
    ADD CONSTRAINT "UQ_f2de6591767f9e27c5f4a17adc9" UNIQUE (order_number);


--
-- Name: users UQ_fe0bb3f6520ee0469504521e710; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE (username);


--
-- Name: IDX_29cd30f736e15404c03cb9d4b4; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_29cd30f736e15404c03cb9d4b4" ON public.clinical_form_configs USING btree (branch_id);


--
-- Name: IDX_2a4d50a7164d3e7b1f7831ed6f; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_2a4d50a7164d3e7b1f7831ed6f" ON public.clinical_form_configs USING btree (company_id);


--
-- Name: IDX_31df4aa83afdccf17a6ec8e4a9; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_31df4aa83afdccf17a6ec8e4a9" ON public.laboratory_orders USING btree (attendance_date);


--
-- Name: IDX_4bccf5d81c7bd9ca9a8b8ea719; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_4bccf5d81c7bd9ca9a8b8ea719" ON public.laboratory_orders USING btree (company_id);


--
-- Name: IDX_6a3fafa99b3f9c1e8aa7d5157a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_6a3fafa99b3f9c1e8aa7d5157a" ON public.clinical_histories USING btree (company_id);


--
-- Name: IDX_83bea396b44568c907b291c3eb; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_83bea396b44568c907b291c3eb" ON public.laboratory_orders USING btree (branch_id);


--
-- Name: IDX_97d50f26dd5764039a2cbf2c30; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_97d50f26dd5764039a2cbf2c30" ON public.patients USING btree (company_id);


--
-- Name: IDX_9dba7bb491daa918b2934e662b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_9dba7bb491daa918b2934e662b" ON public.clinical_histories USING btree (branch_id, is_sent);


--
-- Name: IDX_a42dda88ae3a545b268e70af7a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_a42dda88ae3a545b268e70af7a" ON public.patients USING btree (document_number, company_id);


--
-- Name: IDX_ab8c059582f2e2d67a8af7a861; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_ab8c059582f2e2d67a8af7a861" ON public.clinical_histories USING btree (branch_id);


--
-- Name: IDX_b130332f65c0d02b75e3399b9c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_b130332f65c0d02b75e3399b9c" ON public.clinical_histories USING btree (patient_id);


--
-- Name: IDX_c4fc1b1cd80e7c55d359dd7813; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_c4fc1b1cd80e7c55d359dd7813" ON public.patients USING btree (branch_id);


--
-- Name: IDX_de9fd9baff94123ae2d2591fb3; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_de9fd9baff94123ae2d2591fb3" ON public.laboratory_orders USING btree (is_confirmed);


--
-- Name: IDX_f2de6591767f9e27c5f4a17adc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IDX_f2de6591767f9e27c5f4a17adc" ON public.laboratory_orders USING btree (order_number);


--
-- Name: IDX_fb2a10f94d1ac9600e76b910b0; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_fb2a10f94d1ac9600e76b910b0" ON public.laboratory_orders USING btree (patient_id);


--
-- Name: categories FK_0011937b9b4cd88d39accdd6edf; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "FK_0011937b9b4cd88d39accdd6edf" FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: role_modules FK_037d3081ebb1e33fa2b4204e057; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_modules
    ADD CONSTRAINT "FK_037d3081ebb1e33fa2b4204e057" FOREIGN KEY (module_id) REFERENCES public.modules(id);


--
-- Name: role_permissions FK_17022daf3f885f7d35423e9971e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY (permission_id) REFERENCES public.permissions(id);


--
-- Name: role_permissions FK_178199805b901ccd220ab7740ec; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: clinical_form_configs FK_29cd30f736e15404c03cb9d4b40; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinical_form_configs
    ADD CONSTRAINT "FK_29cd30f736e15404c03cb9d4b40" FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: clinical_form_configs FK_2a4d50a7164d3e7b1f7831ed6f7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinical_form_configs
    ADD CONSTRAINT "FK_2a4d50a7164d3e7b1f7831ed6f7" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: shifts FK_2c6e91d710e159b564af1a2d01b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT "FK_2c6e91d710e159b564af1a2d01b" FOREIGN KEY (status_id) REFERENCES public.shift_status(id);


--
-- Name: subcategories FK_3cd708752bf25e44862ccf4a61d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT "FK_3cd708752bf25e44862ccf4a61d" FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: products FK_3f105c75bd8de6544588ec76593; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_3f105c75bd8de6544588ec76593" FOREIGN KEY (default_supplier_id) REFERENCES public.suppliers(id);


--
-- Name: roles FK_4bc1204a05dde26383e3955b0a1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "FK_4bc1204a05dde26383e3955b0a1" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: laboratory_orders FK_4bccf5d81c7bd9ca9a8b8ea7193; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laboratory_orders
    ADD CONSTRAINT "FK_4bccf5d81c7bd9ca9a8b8ea7193" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: laboratory_orders FK_4fce6f548e7f997d20ce5f5274f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laboratory_orders
    ADD CONSTRAINT "FK_4fce6f548e7f997d20ce5f5274f" FOREIGN KEY (clinical_history_id) REFERENCES public.clinical_histories(id);


--
-- Name: branches FK_5973f79e64a27c506b07cd84b29; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT "FK_5973f79e64a27c506b07cd84b29" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: users FK_5a58f726a41264c8b3e86d4a1de; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_5a58f726a41264c8b3e86d4a1de" FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: subcategories FK_644a62f955dc1ffc058e16ed838; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT "FK_644a62f955dc1ffc058e16ed838" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: clinical_histories FK_6a3fafa99b3f9c1e8aa7d5157a1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinical_histories
    ADD CONSTRAINT "FK_6a3fafa99b3f9c1e8aa7d5157a1" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: suppliers FK_6a9681499416e80c1ffac4fe86c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT "FK_6a9681499416e80c1ffac4fe86c" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: permissions FK_738f46bb9ac6ea356f1915835d0; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT "FK_738f46bb9ac6ea356f1915835d0" FOREIGN KEY (module_id) REFERENCES public.modules(id);


--
-- Name: users FK_7ae6334059289559722437bcc1c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_7ae6334059289559722437bcc1c" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: laboratory_orders FK_83bea396b44568c907b291c3eb3; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laboratory_orders
    ADD CONSTRAINT "FK_83bea396b44568c907b291c3eb3" FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: patients FK_97d50f26dd5764039a2cbf2c30b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT "FK_97d50f26dd5764039a2cbf2c30b" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: categories FK_987f987126a3f2e4f9ec03db04e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "FK_987f987126a3f2e4f9ec03db04e" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: products FK_9a5f6868c96e0069e699f33e124; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: laboratory_orders FK_a1206f47307aaebf2354974f9f8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laboratory_orders
    ADD CONSTRAINT "FK_a1206f47307aaebf2354974f9f8" FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: users FK_a2cecd1a3531c0b041e29ba46e1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: companies FK_a3dbf2085cb73fb94ddf2106ad4; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT "FK_a3dbf2085cb73fb94ddf2106ad4" FOREIGN KEY (logo_file_id) REFERENCES public.files(id);


--
-- Name: clinical_histories FK_ab8c059582f2e2d67a8af7a8612; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinical_histories
    ADD CONSTRAINT "FK_ab8c059582f2e2d67a8af7a8612" FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: clinical_histories FK_b130332f65c0d02b75e3399b9c8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinical_histories
    ADD CONSTRAINT "FK_b130332f65c0d02b75e3399b9c8" FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: products FK_b417f1726f6ccafb18730adffb0; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_b417f1726f6ccafb18730adffb0" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: patients FK_c4fc1b1cd80e7c55d359dd78137; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT "FK_c4fc1b1cd80e7c55d359dd78137" FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: products FK_c9de3a8edea9269ca774c919b9a; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_c9de3a8edea9269ca774c919b9a" FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id);


--
-- Name: shifts FK_cddc0af590dd113d6e5b6b530c8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT "FK_cddc0af590dd113d6e5b6b530c8" FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: suppliers FK_ce35fd787e09aecdb311aaff66c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT "FK_ce35fd787e09aecdb311aaff66c" FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: products FK_d4131ec6fde82732ee2f3a777cd; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_d4131ec6fde82732ee2f3a777cd" FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- Name: role_modules FK_d94c957204d1c78e702a97cc1a9; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_modules
    ADD CONSTRAINT "FK_d94c957204d1c78e702a97cc1a9" FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: products FK_de720484cb95d8752861e507921; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_de720484cb95d8752861e507921" FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: shifts FK_dfcdd9987957c59812b920027e6; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT "FK_dfcdd9987957c59812b920027e6" FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: shifts FK_e155f8dd2a50f91604c8d946369; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT "FK_e155f8dd2a50f91604c8d946369" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: subcategories FK_f7b015bc580ae5179ba5a4f42ec; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT "FK_f7b015bc580ae5179ba5a4f42ec" FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: laboratory_orders FK_fb2a10f94d1ac9600e76b910b0d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laboratory_orders
    ADD CONSTRAINT "FK_fb2a10f94d1ac9600e76b910b0d" FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- PostgreSQL database dump complete
--

\unrestrict PSQ4bM8yVCPohHDZRz6smjmdNZP4Y9sCfrZZB0ukqKbHjUfw7QF9U0AgCaxzceb


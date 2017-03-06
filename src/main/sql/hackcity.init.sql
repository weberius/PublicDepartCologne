--
-- Name: haltestellen; Type: TABLE; Schema: public; Owner: postgres
--

DROP TABLE IF EXISTS haltestellen;
CREATE TABLE haltestellen (
    gid integer NOT NULL,
    name character varying(40),
    knotennumm character varying(20),
    typ character varying(20),
    nr_stadtte character varying(3),
    stadtteil character varying(40),
    nr_stadtbe character varying(1),
    stadtbezir character varying(40),
    hyperlink character varying(200),
    objectid numeric(10,0),
    geom geometry(Point)
);

--
-- Name: haltestellen_gid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE haltestellen_gid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
    

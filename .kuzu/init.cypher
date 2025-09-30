
        CREATE NODE TABLE Module (
          path STRING PRIMARY KEY,
          name STRING,
          package STRING,
          lastModified TIMESTAMP,
          gitSha STRING
        );
        
        CREATE NODE TABLE Symbol (
          id STRING PRIMARY KEY,
          name STRING,
          kind STRING,
          exported BOOLEAN,
          file STRING,
          line INT32,
          col INT32,
          gitSha STRING
        );
        
        CREATE NODE TABLE Type (
          id STRING PRIMARY KEY,
          name STRING,
          primitive BOOLEAN,
          generic BOOLEAN,
          nullable BOOLEAN,
          readonly BOOLEAN
        );
        
        CREATE REL TABLE DECLARES (FROM Module TO Symbol);
        CREATE REL TABLE EXTENDS (FROM Symbol TO Symbol);
        CREATE REL TABLE IMPLEMENTS (FROM Symbol TO Symbol);
        CREATE REL TABLE REFERENCES (FROM Symbol TO Symbol);
        CREATE REL TABLE IMPORTS (FROM Module TO Module);
        CREATE REL TABLE HAS_TYPE (FROM Symbol TO Type);
      

        CREATE TABLE IF NOT EXISTS file_metrics (
          path VARCHAR PRIMARY KEY,
          extension VARCHAR,
          lines INTEGER,
          size INTEGER,
          complexity INTEGER,
          imports INTEGER,
          exports INTEGER,
          last_modified TIMESTAMP,
          scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS type_coverage (
          date TIMESTAMP PRIMARY KEY,
          total_lines INTEGER,
          typed_lines INTEGER,
          coverage_percentage DECIMAL(5,2),
          any_count INTEGER,
          unknown_count INTEGER
        );
        
        CREATE TABLE IF NOT EXISTS dependency_metrics (
          package_name VARCHAR PRIMARY KEY,
          version VARCHAR,
          size_kb INTEGER,
          direct BOOLEAN,
          usage_count INTEGER,
          last_updated TIMESTAMP
        );
      
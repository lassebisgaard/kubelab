const mysql = require('mysql2/promise');
const config = require('../config/database');

async function migrate() {
    const connection = await mysql.createConnection(config);
    try {
        await connection.execute(
            'ALTER TABLE Teams ADD COLUMN Description TEXT'
        );
        console.log('Successfully added Description column to Teams table');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate(); 
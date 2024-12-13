const bcrypt = require('bcrypt');
const pool = require('../config/database');
const saltRounds = 12;

async function hashExistingPasswords() {
    const connection = await pool.getConnection();
    try {
        // Hent alle eksisterende brugere
        const [users] = await connection.execute('SELECT UserId, Password FROM Users');
        
        for (const user of users) {
            // Hash hvert eksisterende password
            const hashedPassword = await bcrypt.hash(user.Password, saltRounds);
            
            // Opdater i databasen
            await connection.execute(
                'UPDATE Users SET Password = ? WHERE UserId = ?',
                [hashedPassword, user.UserId]
            );
        }
        
        console.log('All passwords have been hashed successfully');
    } catch (error) {
        console.error('Error hashing passwords:', error);
    } finally {
        connection.release();
    }
}

// Kør scriptet
hashExistingPasswords().then(() => {
    console.log('Password migration complete');
    process.exit(0);
}).catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
}); 
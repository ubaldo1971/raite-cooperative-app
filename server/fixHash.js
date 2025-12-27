const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

async function fixUserPassword() {
    const password = '2017@Electricidad';

    // Generate hash
    const hash = await bcrypt.hash(password, 10);

    console.log('='.repeat(60));
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('Hash length:', hash.length);
    console.log('='.repeat(60));

    // Verify it works
    const isValid = await bcrypt.compare(password, hash);
    console.log('Verification:', isValid ? '✓ VALID' : '✗ INVALID');
    console.log('='.repeat(60));

    // Read db.json
    const dbPath = path.join(__dirname, 'src', 'data', 'db.json');
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    // Update the user's password hash
    if (db.users && db.users[0]) {
        db.users[0].password_hash = hash;
        console.log('Updated user:', db.users[0].email);

        // Write back to file
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
        console.log('✓ Database updated successfully');
        console.log('='.repeat(60));
    }
}

fixUserPassword().catch(console.error);

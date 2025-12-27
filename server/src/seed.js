const db = require('./db');
const { generateMemberId } = require('./utils/idGenerator');

const seed = async () => {
    try {
        console.log('Seeding Database (JSON)...');

        // Check if user exists
        const check = db.getUserByEmail('juan@raite.mx');
        if (check) {
            console.log('User already exists (Seed). Skipping...');
            process.exit(0);
        }

        const fullName = "Juan Pérez López";
        const email = "juan@raite.mx";
        const password = "123";
        const birthDate = "1985-05-20";

        // Generate ID
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');
        const memberId = generateMemberId(firstName, lastName, birthDate);

        // Insert
        const newUser = db.createUser({
            full_name: fullName,
            email,
            password_hash: password,
            birth_date: birthDate,
            member_id: memberId,
            role: 'member',
            profile_image: 'https://via.placeholder.com/150'
        });

        console.log('User Created Successfully:', newUser);
        console.log('Member ID:', newUser.member_id);

        process.exit(0);
    } catch (err) {
        console.error('Seed Error:', err);
        process.exit(1);
    }
};

seed();

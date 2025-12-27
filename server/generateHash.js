const bcrypt = require('bcrypt');

async function main() {
    const password = '2017@Electricidad';
    const hash = await bcrypt.hash(password, 10);
    console.log('Password:', password);
    console.log('Hash length:', hash.length);
    console.log('Hash:', hash);

    // Test the hash
    const isValid = await bcrypt.compare(password, hash);
    console.log('Valid:', isValid);
}

main();

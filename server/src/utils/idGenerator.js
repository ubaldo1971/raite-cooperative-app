const generateMemberId = (firstName, lastName, birthDate) => {
    // Basic RFC-like logic
    // 1. First 2 letters of Paternal Last Name (We assume lastName field might have both, so we split)
    // 2. First 2 letters of Maternal Last Name
    // 3. First 2 letters of Name
    // 4. YYYYMMDD
    // 5. 3 Random chars

    // Normalize text
    const cleanString = (str) => str ? str.trim().toUpperCase().replace(/[^A-Z]/g, 'X') : 'XX';

    // Split names
    const names = cleanString(firstName);
    const surnames = lastName ? lastName.trim().toUpperCase().split(' ') : ['XX', 'XX'];
    const paternal = cleanString(surnames[0]);
    const maternal = surnames.length > 1 ? cleanString(surnames[1]) : 'XX';

    const pCode = paternal.substring(0, 2).padEnd(2, 'X');
    const mCode = maternal.substring(0, 2).padEnd(2, 'X');
    const nCode = names.substring(0, 2).padEnd(2, 'X');

    // Date
    let dateCode = '00000000';
    if (birthDate) {
        const d = new Date(birthDate);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dateCode = `${y}${m}${day}`;
    }

    // Random
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    return `${pCode}${mCode}${nCode}${dateCode}${random}`;
};

module.exports = { generateMemberId };

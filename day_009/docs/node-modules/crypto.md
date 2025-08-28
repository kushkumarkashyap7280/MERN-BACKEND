# Crypto Module

The `crypto` module provides cryptographic functionality for Node.js applications, including secure hashing, encryption, decryption, signing, and verification.

## Key Features

- **Hashing**: Generate secure hashes of data
- **HMAC**: Hash-based message authentication codes
- **Encryption/Decryption**: Secure data using various algorithms
- **Key Generation**: Create cryptographic keys
- **Digital Signatures**: Sign and verify data
- **Random Values**: Generate cryptographically secure random values

## Common Use Cases

| Use Case | Description | Example Functions |
|----------|-------------|-------------------|
| Password Hashing | Securely store user passwords | `scrypt`, `pbkdf2` |
| Data Integrity | Verify data hasn't been tampered with | `createHash`, `createHmac` |
| Secure Communication | Encrypt sensitive information | `createCipheriv`, `createDecipheriv` |
| Authentication | Verify identities | `createSign`, `createVerify` |
| Session Management | Generate secure tokens | `randomBytes`, `randomUUID` |

## Hashing

```javascript
import crypto from 'crypto';

// Create a hash
function hashData(data) {
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}

// Usage
const sensitiveData = 'my-secret-information';
const hashedData = hashData(sensitiveData);
console.log(hashedData); // 7b9be694b5446e41...
```

### Common Hash Algorithms

| Algorithm | Security Level | Output Size | Notes |
|-----------|----------------|-------------|-------|
| SHA-256   | High           | 32 bytes    | General purpose, recommended |
| SHA-512   | Very High      | 64 bytes    | Stronger but slower than SHA-256 |
| SHA-3     | Very High      | Configurable| Modern, resistant to length extension |
| MD5       | Very Low       | 16 bytes    | Deprecated, collision vulnerable |
| SHA-1     | Low            | 20 bytes    | Deprecated, collision vulnerable |

## Password Hashing

```javascript
import crypto from 'crypto';

// Hash a password with salt using scrypt (recommended for passwords)
async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    // Generate a random salt
    const salt = crypto.randomBytes(16).toString('hex');
    
    // Hash the password with the salt
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ':' + derivedKey.toString('hex'));
    });
  });
}

// Verify a password against a hash
async function verifyPassword(password, hash) {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
}

// Usage
async function testPasswordHashing() {
  const password = 'user-secure-password';
  
  // Hash password for storage
  const hashedPassword = await hashPassword(password);
  console.log('Stored hash:', hashedPassword);
  
  // Later, verify password
  const isMatch = await verifyPassword(password, hashedPassword);
  console.log('Password matches:', isMatch); // true
  
  const isMatchWrong = await verifyPassword('wrong-password', hashedPassword);
  console.log('Wrong password matches:', isMatchWrong); // false
}

testPasswordHashing().catch(console.error);
```

## Encryption and Decryption

```javascript
import crypto from 'crypto';

// Encrypt data with AES-256-GCM
function encryptData(text, secretKey) {
  // Convert the secret key to a Buffer if it's not already
  const key = Buffer.from(secretKey, 'hex');
  
  // Generate a random initialization vector
  const iv = crypto.randomBytes(16);
  
  // Create cipher
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  // Encrypt the data
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Get the authentication tag
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Return IV, encrypted data, and auth tag
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag
  };
}

// Decrypt data with AES-256-GCM
function decryptData({ iv, encryptedData, authTag }, secretKey) {
  // Convert the secret key to a Buffer if it's not already
  const key = Buffer.from(secretKey, 'hex');
  
  // Create decipher
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm', 
    key, 
    Buffer.from(iv, 'hex')
  );
  
  // Set auth tag
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  // Decrypt the data
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Usage
function testEncryption() {
  // Generate a secure random key (32 bytes for AES-256)
  const key = crypto.randomBytes(32).toString('hex');
  
  const originalText = 'This is a secret message!';
  console.log('Original:', originalText);
  
  // Encrypt
  const encrypted = encryptData(originalText, key);
  console.log('Encrypted:', encrypted);
  
  // Decrypt
  const decrypted = decryptData(encrypted, key);
  console.log('Decrypted:', decrypted);
}

testEncryption();
```

## Digital Signatures

```javascript
import crypto from 'crypto';

// Generate key pair
function generateKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
}

// Sign data with private key
function signData(data, privateKey) {
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  sign.end();
  return sign.sign(privateKey, 'hex');
}

// Verify signature with public key
function verifySignature(data, signature, publicKey) {
  const verify = crypto.createVerify('SHA256');
  verify.update(data);
  verify.end();
  return verify.verify(publicKey, signature, 'hex');
}

// Usage
function testDigitalSignature() {
  // Generate key pair
  const { privateKey, publicKey } = generateKeyPair();
  
  // Data to sign
  const data = 'This message needs to be authenticated';
  
  // Create signature
  const signature = signData(data, privateKey);
  console.log('Signature:', signature);
  
  // Verify the signature
  const isVerified = verifySignature(data, signature, publicKey);
  console.log('Signature verified:', isVerified); // true
  
  // Try to verify tampered data
  const tamperedData = 'This message has been tampered with';
  const isTamperedVerified = verifySignature(tamperedData, signature, publicKey);
  console.log('Tampered data verified:', isTamperedVerified); // false
}

testDigitalSignature();
```

## Generating Random Values

```javascript
import crypto from 'crypto';

// Generate a secure random buffer
function generateRandomBuffer(bytes) {
  return crypto.randomBytes(bytes);
}

// Generate a secure random string
function generateRandomString(length, encoding = 'hex') {
  return crypto.randomBytes(Math.ceil(length / 2)).toString(encoding);
}

// Generate a secure random number within a range
function generateRandomNumber(min, max) {
  // Generate 4 bytes of randomness
  const randomBuffer = crypto.randomBytes(4);
  // Convert to a 32-bit unsigned integer
  const randomNumber = randomBuffer.readUInt32BE(0);
  // Scale to our range
  return min + (randomNumber / 0xffffffff) * (max - min);
}

// Generate a UUID v4
function generateUUID() {
  return crypto.randomUUID();
}

// Usage
console.log('Random Buffer:', generateRandomBuffer(16));
console.log('Random Hex String:', generateRandomString(32));
console.log('Random Base64 String:', generateRandomString(24, 'base64'));
console.log('Random Number (1-100):', Math.floor(generateRandomNumber(1, 100)));
console.log('Random UUID:', generateUUID());
```

## Best Practices

1. **Use modern algorithms**: Prefer AES-GCM over AES-CBC, SHA-256+ over MD5/SHA-1
2. **Secure key management**: Never hardcode keys, use environment variables or secure key stores
3. **Use authenticated encryption**: AES-GCM, ChaCha20-Poly1305 provide authentication
4. **Proper password hashing**: Use scrypt, bcrypt, or Argon2 with salt
5. **Constant-time comparisons**: Use crypto.timingSafeEqual for comparing secret values
6. **Secure random generation**: Always use crypto.randomBytes/randomUUID for security-critical randomness
7. **Keep dependencies updated**: Cryptography libraries need frequent security updates

## Common Pitfalls

- **Implementing your own crypto**: Never create your own cryptographic algorithms
- **Using weak algorithms**: MD5, SHA-1, DES, etc. are considered insecure
- **Predictable IVs/nonces**: Always use random, unique IVs for each encryption
- **Reusing keys**: Different operations should use different keys
- **Missing authentication**: Use HMAC or authenticated encryption modes
- **Timing attacks**: Avoid variable-time comparisons for sensitive data
- **Key size too small**: Use appropriate key sizes (e.g., 256 bits for AES)

## Resources

- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [Cryptographic Right Answers](https://latacora.micro.blog/2018/04/03/cryptographic-right-answers.html)

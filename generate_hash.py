import bcrypt

def generate_bcrypt_hash(password, salt_rounds=12):
    """Genera un hash bcrypt para la contraseña dada"""
    salt = bcrypt.gensalt(rounds=salt_rounds)
    hash_bytes = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hash_bytes.decode('utf-8')

# Generar hash para password123
password = 'password123'
hash_result = generate_bcrypt_hash(password)

print(f"Contraseña: {password}")
print(f"Hash generado: {hash_result}")

# También generar para otros usuarios
users = {
    'password123': 'usuario.normal@gmail.com',
    'instructor123': 'instructor.master@gmail.com', 
    'moderador123': 'moderador.content@gmail.com',
    'admin123': 'admin.sistema@gmail.com',
    'social123': 'social.user@gmail.com'
}

print("\n=== HASHES PARA TODOS LOS USUARIOS ===")
for pwd, email in users.items():
    hash_pwd = generate_bcrypt_hash(pwd)
    print(f"Email: {email}")
    print(f"Password: {pwd}")
    print(f"Hash: {hash_pwd}")
    print("-" * 50)
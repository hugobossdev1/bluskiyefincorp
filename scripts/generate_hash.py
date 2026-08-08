import sys, os, hashlib
pwd = sys.argv[1] if len(sys.argv) > 1 else 'X8n$G7vPq4rZ!2sY'
salt = os.urandom(16).hex()
h = hashlib.pbkdf2_hmac('sha512', pwd.encode(), bytes.fromhex(salt), 100000).hex()
print(salt)
print(h)

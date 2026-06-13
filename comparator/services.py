"""
Static + computed metrics for well-known cryptographic algorithms.
Covers key generation methods, security properties, and performance profiles.
"""

ALGORITHM_DATA = {
    'RSA': {
        'full_name': 'Rivest–Shamir–Adleman',
        'type': 'Asymmetric',
        'key_sizes': [1024, 2048, 3072, 4096],
        'recommended_key_size': 3072,
        'security_bits': {1024: 80, 2048: 112, 3072: 128, 4096: 140},
        'key_gen_method': 'Large prime factorization (p × q)',
        'hardness': 'Integer Factorization Problem (IFP)',
        'quantum_resistant': False,
        'speed_score': 30,        # relative 0-100 (higher = faster)
        'security_score': 75,
        'memory_score': 40,
        'use_cases': ['Digital signatures', 'Key exchange', 'TLS/SSL certificates'],
        'standards': ['PKCS#1', 'FIPS 186-5', 'RFC 8017'],
        'year_introduced': 1977,
    },
    'AES': {
        'full_name': 'Advanced Encryption Standard',
        'type': 'Symmetric (Block)',
        'key_sizes': [128, 192, 256],
        'recommended_key_size': 256,
        'security_bits': {128: 128, 192: 192, 256: 256},
        'key_gen_method': 'CSPRNG (os.urandom / NIST SP 800-90A)',
        'hardness': 'Key Recovery / Exhaustive Search',
        'quantum_resistant': False,
        'speed_score': 95,
        'security_score': 95,
        'memory_score': 95,
        'use_cases': ['File encryption', 'TLS record layer', 'Disk encryption', 'VPNs'],
        'standards': ['FIPS 197', 'ISO/IEC 18033-3'],
        'year_introduced': 2001,
    },
    'ECC': {
        'full_name': 'Elliptic Curve Cryptography',
        'type': 'Asymmetric',
        'key_sizes': [192, 224, 256, 384, 521],
        'recommended_key_size': 256,
        'security_bits': {192: 96, 224: 112, 256: 128, 384: 192, 521: 260},
        'key_gen_method': 'Random scalar on elliptic curve (ECDH / ECDSA)',
        'hardness': 'Elliptic Curve Discrete Logarithm Problem (ECDLP)',
        'quantum_resistant': False,
        'speed_score': 80,
        'security_score': 90,
        'memory_score': 85,
        'use_cases': ['Mobile TLS', 'Digital signatures (ECDSA)', 'Key agreement (ECDH)', 'Blockchain'],
        'standards': ['FIPS 186-5', 'SEC 1', 'RFC 6090'],
        'year_introduced': 1985,
    },
    'ChaCha20': {
        'full_name': 'ChaCha20-Poly1305',
        'type': 'Symmetric (Stream)',
        'key_sizes': [256],
        'recommended_key_size': 256,
        'security_bits': {256: 256},
        'key_gen_method': 'CSPRNG 256-bit key + 96-bit nonce',
        'hardness': 'Key Recovery / Known-plaintext',
        'quantum_resistant': False,
        'speed_score': 98,
        'security_score': 93,
        'memory_score': 98,
        'use_cases': ['Mobile encryption', 'TLS 1.3', 'WireGuard VPN', 'Low-power devices'],
        'standards': ['RFC 8439', 'TLS 1.3'],
        'year_introduced': 2008,
    },
    '3DES': {
        'full_name': 'Triple Data Encryption Standard',
        'type': 'Symmetric (Block)',
        'key_sizes': [112, 168],
        'recommended_key_size': 168,
        'security_bits': {112: 80, 168: 112},
        'key_gen_method': 'Three independent DES keys (EDE mode)',
        'hardness': 'Meet-in-the-middle + Brute Force',
        'quantum_resistant': False,
        'speed_score': 20,
        'security_score': 45,
        'memory_score': 60,
        'use_cases': ['Legacy banking (EMV)', 'Older VPN configs', 'Backward compatibility'],
        'standards': ['FIPS 46-3 (retired)', 'ANSI X9.52'],
        'year_introduced': 1998,
    },
    'Kyber': {
        'full_name': 'CRYSTALS-Kyber (ML-KEM)',
        'type': 'Asymmetric (PQC)',
        'key_sizes': [512, 768, 1024],
        'recommended_key_size': 768,
        'security_bits': {512: 128, 768: 192, 1024: 256},
        'key_gen_method': 'Module Learning With Errors (M-LWE) lattice',
        'hardness': 'Module-LWE (quantum-hard)',
        'quantum_resistant': True,
        'speed_score': 85,
        'security_score': 95,
        'memory_score': 70,
        'use_cases': ['Post-quantum key encapsulation', 'TLS post-quantum hybrid', 'Future-proof systems'],
        'standards': ['NIST FIPS 203', 'CRYSTALS'],
        'year_introduced': 2017,
    },
}

METRIC_LABELS = {
    'speed_score': 'Speed',
    'security_score': 'Security',
    'memory_score': 'Memory Efficiency',
}

COMPARISON_FIELDS = [
    ('type', 'Type'),
    ('key_gen_method', 'Key Generation Method'),
    ('hardness', 'Hard Problem'),
    ('quantum_resistant', 'Quantum Resistant'),
    ('recommended_key_size', 'Recommended Key Size (bits)'),
    ('year_introduced', 'Year Introduced'),
    ('standards', 'Standards'),
    ('use_cases', 'Common Use Cases'),
]


def get_algorithm_names() -> list:
    return list(ALGORITHM_DATA.keys())


def compare_algorithms(names: list) -> dict:
    """Return structured comparison data for a list of algorithm names."""
    selected = {name: ALGORITHM_DATA[name] for name in names if name in ALGORITHM_DATA}
    if not selected:
        return {}

    chart_data = {
        'labels': list(METRIC_LABELS.values()),
        'datasets': [],
        'colors': ['#4f8ef7', '#34d399', '#f97316', '#a78bfa', '#fb7185', '#facc15'],
    }

    for i, (name, data) in enumerate(selected.items()):
        chart_data['datasets'].append({
            'label': name,
            'data': [data['speed_score'], data['security_score'], data['memory_score']],
            'color': chart_data['colors'][i % len(chart_data['colors'])],
        })

    table_rows = []
    for field_key, field_label in COMPARISON_FIELDS:
        row = {'label': field_label, 'values': []}
        for name, data in selected.items():
            val = data.get(field_key, '—')
            if isinstance(val, list):
                val = ', '.join(str(v) for v in val)
            elif isinstance(val, bool):
                val = '✓ Yes' if val else '✗ No'
            row['values'].append({'algo': name, 'value': val})
        table_rows.append(row)

    return {
        'algorithms': selected,
        'chart_data': chart_data,
        'table_rows': table_rows,
        'names': list(selected.keys()),
    }

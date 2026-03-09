// backend/tests/__mocks__/database/supabaseAdmin.js
// Mock manual de supabaseAdmin para tests.
// Se usa via moduleNameMapper en jest.config.js para evitar que el módulo real
// llame a process.exit(1) cuando SUPABASE_SERVICE_ROLE_KEY no está configurada.

const supabaseAdmin = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
        admin: {
            createUser: jest.fn().mockResolvedValue({
                data: { user: { id: 'test-user-id' } },
                error: null
            }),
            updateUserById: jest.fn().mockResolvedValue({
                data: { user: { id: 'test-user-id' } },
                error: null
            }),
            listUsers: jest.fn().mockResolvedValue({
                data: { users: [] },
                error: null
            })
        },
        signInWithPassword: jest.fn().mockResolvedValue({
            data: { session: { access_token: 'test-token' } },
            error: null
        })
    },
    storage: {
        from: jest.fn().mockReturnThis(),
        upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
        download: jest.fn().mockResolvedValue({ data: {}, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'http://test.url' } })
    }
};

const getUserByEmail = jest.fn().mockResolvedValue({
    data: { user: { id: 'test-user-id', email: 'test@example.com' } },
    error: null
});

const confirmUserEmail = jest.fn().mockResolvedValue({
    success: true,
    data: {}
});

module.exports = {
    supabaseAdmin,
    getUserByEmail,
    confirmUserEmail
};
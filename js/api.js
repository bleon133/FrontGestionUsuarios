const API_BASE = 'https://www.proyectosbleon.somee.com/api/v1';

function apiCall(method, endpoint, data = null) {
    return new Promise((resolve, reject) => {
        const settings = {
            url: `${API_BASE}${endpoint}`,
            method: method,
            contentType: 'application/json',
            headers: {},
            success: resolve,
            error: (xhr) => {
                const body = xhr.responseJSON;
                const msg = body?.message || body?.Message || xhr.responseText || `Error ${xhr.status}`;
                reject(new Error(msg));
            }
        };
        if (data) settings.data = JSON.stringify(data);

        const token = sessionStorage.getItem('token');
        if (token) settings.headers['Authorization'] = `Bearer ${token}`;

        $.ajax(settings);
    });
}

const API = {
    usuarios: {
        getAll:    ()       => apiCall('GET',    '/Usuarios'),
        getById:   (id)     => apiCall('GET',    `/Usuarios/${id}`),
        getByUser: (u)      => apiCall('GET',    `/Usuarios/username/${u}`),
        create:    (d)      => apiCall('POST',   '/Usuarios', d),
        update:    (id, d)  => apiCall('PUT',    `/Usuarios/${id}`, d),
        delete:    (id)     => apiCall('DELETE', `/Usuarios/${id}`),
        toggle:    (id)     => apiCall('PATCH',  `/Usuarios/${id}/toggle-suspendido`), // ← igual que el backend
    },
    perfiles: {
        getAll:   ()       => apiCall('GET',    '/PerfilesUsuarios'),        // ← GET "" del controller
        getById:  (id)     => apiCall('GET',    `/PerfilesUsuarios/${id}`),
        create:   (d)      => apiCall('POST',   '/PerfilesUsuarios', d),
        update:   (id, d)  => apiCall('PUT',    `/PerfilesUsuarios/${id}`, d),
        delete:   (id)     => apiCall('DELETE', `/PerfilesUsuarios/${id}`),
    },
    direcciones: {
        getAll:   ()       => apiCall('GET',    '/Direcciones'),
        getById:  (id)     => apiCall('GET',    `/Direcciones/${id}`),
        create:   (d)      => apiCall('POST',   '/Direcciones', d),
        update:   (id, d)  => apiCall('PUT',    `/Direcciones/${id}`, d),
        delete:   (id)     => apiCall('DELETE', `/Direcciones/${id}`),
    },
    telefonos: {
        getAll:      ()      => apiCall('GET',    '/Telefonos'),
        getById:     (id)    => apiCall('GET',    `/Telefonos/${id}`),
        getByPerfil: (id)    => apiCall('GET',    `/Telefonos/perfil/${id}`),
        create:      (d)     => apiCall('POST',   '/Telefonos', d),
        update:      (id, d) => apiCall('PUT',    `/Telefonos/${id}`, d),
        delete:      (id)    => apiCall('DELETE', `/Telefonos/${id}`),
    },
    roles: {
        // RolesController tiene prefix "api/roles" (sin v1), la base ya tiene v1
        // entonces hay que salir del v1 — mejor cambia el RoutePrefix del controller
        // a "api/v1/roles" y deja el api.js así:
        getAll:      ()      => apiCall('GET',    '/roles'),
        getById:     (id)    => apiCall('GET',    `/roles/${id}`),
        getByNombre: (n)     => apiCall('GET',    `/roles/nombre/${n}`),
        create:      (d)     => apiCall('POST',   '/roles', d),
        update:      (id, d) => apiCall('PUT',    `/roles/${id}`, d),
        delete:      (id)    => apiCall('DELETE', `/roles/${id}`),
    },
    usuarioRoles: {
        getAll:       ()     => apiCall('GET',    '/UsuarioRoles'),
        getById:      (id)   => apiCall('GET',    `/UsuarioRoles/${id}`),
        getByUsuario: (id)   => apiCall('GET',    `/UsuarioRoles/usuario/${id}`),
        create:       (d)    => apiCall('POST',   '/UsuarioRoles', d),
        delete:       (id)   => apiCall('DELETE', `/UsuarioRoles/${id}`),
    },
};

function requireAuth() {
    const user = sessionStorage.getItem('user');
    if (!user && !window.location.pathname.includes('login.html')) {
        window.location.href = '../login.html';
    }
}

function toast(msg, type = 'success') {
    const t = document.createElement('div');
    t.className = `toast-msg toast-${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3000);
}

function showSpinner(show = true) {
    const el = document.getElementById('globalSpinner');
    if (el) el.classList.toggle('d-none', !show);
}
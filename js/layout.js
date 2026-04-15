// Inyecta la barra lateral y el spinner global en cada página
function renderLayout(activeKey) {
  const links = [
    { key:'dashboard',    icon:'fa-gauge',          label:'Dashboard',       href:'dashboard.html'    },
    { key:'perfiles',     icon:'fa-id-card',         label:'Perfiles',        href:'perfiles.html'     },
    { key:'listado',      icon:'fa-table-list',      label:'Listado General', href:'listado.html'      },
    { key:'direcciones',  icon:'fa-map-marker-alt',  label:'Direcciones',     href:'direcciones.html'  },
    { key:'roles',        icon:'fa-shield-halved',   label:'Roles',           href:'roles.html'        },
    { key:'usuarios',     icon:'fa-users',           label:'Usuarios',        href:'usuarios.html'     },
  ];

  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const username = user.Username || 'Usuario';

  const navItems = links.map(l => `
    <a href="${l.href}" class="${l.key === activeKey ? 'active' : ''}">
      <i class="fa ${l.icon}"></i> ${l.label}
    </a>`).join('');

  const sidebar = `
  <div class="sidebar" id="sidebar">
    <a class="sidebar-brand" href="dashboard.html">
      <span class="dot"></span> SGU &nbsp;<small style="font-weight:300;font-size:.75rem">v1.0</small>
    </a>
    <nav>${navItems}</nav>
    <div class="sidebar-footer">
      Sesión: <strong>${username}</strong><br>
      <a href="#" id="btnLogout" style="color:#ef4444;font-weight:600;font-size:.8rem;text-decoration:none;">
        <i class="fa fa-sign-out-alt"></i> Cerrar sesión
      </a>
    </div>
  </div>
  <div id="globalSpinner" class="d-none">
    <div class="spinner-ring"></div>
  </div>`;

  document.body.insertAdjacentHTML('afterbegin', sidebar);

  document.getElementById('btnLogout').addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.clear();
    window.location.href = '../login.html';
  });
}

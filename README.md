# TaskAlert — Gestor de tareas con recordatorios

Aplicación móvil multiplataforma (**Android** e **iOS**) para registrar tareas con fecha y hora de entrega, y recibir **notificaciones automáticas** antes del vencimiento. Por defecto avisa **1 día antes**, pero cada usuario puede configurar sus propios recordatorios (por ejemplo: 1 semana, 3 horas y 30 minutos antes).

---

## Funcionalidades

### MVP
- Crear, editar y eliminar tareas (título, descripción opcional, fecha y hora de entrega).
- Recordatorio por defecto **24 horas antes** de la entrega.
- Recordatorios personalizables por tarea (varios por tarea).
- Recordatorios por defecto configurables en Ajustes (se aplican a tareas nuevas).
- Marcar tareas como completadas (cancela sus notificaciones pendientes).
- Vistas: Pendientes, Hoy, Próximas, Vencidas, Completadas.
- Almacenamiento local, funciona sin internet.

### Futuras mejoras
- Tareas recurrentes (diarias, semanales).
- Etiquetas, prioridades y colores.
- Botón "Posponer" desde la notificación.
- Sincronización en la nube y cuenta de usuario.
- Integración con calendario del sistema.
- Modo oscuro y widgets de pantalla de inicio.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | [Expo](https://expo.dev) (SDK más reciente) + React Native |
| Lenguaje | TypeScript |
| Navegación | Expo Router |
| Notificaciones | `expo-notifications` (notificaciones **locales** programadas) |
| Base de datos local | `expo-sqlite` + Drizzle ORM |
| Estado global | Zustand |
| Selector de fecha/hora | `@react-native-community/datetimepicker` |
| Fechas | `date-fns` |
| Formularios / validación | React Hook Form + Zod |
| Testing | Jest + React Native Testing Library |
| Builds | EAS Build |

> Se usan notificaciones **locales** (programadas en el propio dispositivo), así que no hace falta servidor ni Firebase para el MVP.

---

## Estructura del proyecto

```
AppTareas/
├── src/
│   ├── app/                        # Rutas (Expo Router)
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx         # Barra de pestañas
│   │   │   ├── index.tsx           # Tareas: Pendientes / Hoy / Próximas / Vencidas
│   │   │   ├── completed.tsx       # Tareas completadas
│   │   │   └── settings.tsx        # Ajustes y recordatorios por defecto
│   │   ├── task/
│   │   │   ├── new.tsx             # Crear tarea
│   │   │   └── [id].tsx            # Ver / editar / completar / eliminar tarea
│   │   └── _layout.tsx             # Migraciones, permisos y navegación desde notificaciones
│   ├── components/                 # TaskCard, TaskForm, ReminderPicker, DateTimeField...
│   ├── constants/theme.ts          # Colores (claro / oscuro) y espaciados
│   ├── db/
│   │   ├── schema.ts               # Tablas (Drizzle)
│   │   └── client.ts
│   ├── hooks/
│   ├── services/
│   │   ├── notifications.ts        # Programar / cancelar notificaciones
│   │   ├── settings.ts             # Recordatorios por defecto
│   │   └── tasks.ts                # CRUD de tareas + reprogramación
│   ├── store/                      # Zustand (tareas y ajustes)
│   ├── types/
│   └── utils/
│       ├── reminders.ts            # Cálculo de fechas de aviso
│       ├── task-filters.ts         # Vistas (hoy, próximas, vencidas...)
│       └── task-schema.ts          # Validación del formulario (Zod)
├── drizzle/                        # Migraciones SQL generadas por drizzle-kit
├── assets/
├── app.json
├── eas.json
├── drizzle.config.ts
├── package.json
└── README.md
```

---

## Modelo de datos

### `tasks`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | TEXT (UUID) | Identificador |
| `title` | TEXT | Título de la tarea |
| `description` | TEXT? | Detalle opcional |
| `due_at` | INTEGER | Fecha/hora de entrega (timestamp ms) |
| `completed` | INTEGER (0/1) | Estado |
| `created_at` | INTEGER | Fecha de creación |
| `updated_at` | INTEGER | Última modificación |

### `reminders`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | TEXT (UUID) | Identificador |
| `task_id` | TEXT | FK → `tasks.id` (ON DELETE CASCADE) |
| `offset_minutes` | INTEGER | Minutos antes de `due_at` (ej. `1440` = 1 día) |
| `notification_id` | TEXT? | ID devuelto por `expo-notifications` para poder cancelarla |

### `settings`
| Clave | Valor por defecto |
|---|---|
| `default_reminders` | `[1440]` (1 día antes) |

---

## Lógica de notificaciones

1. Al **crear** una tarea se le asignan los recordatorios por defecto (o los que el usuario elija).
2. Por cada recordatorio se calcula `triggerDate = due_at - offset_minutes`.
3. Si `triggerDate` ya pasó, ese recordatorio se omite.
4. Se programa con `Notifications.scheduleNotificationAsync` y se guarda el `notification_id`.
5. Al **editar** la tarea o sus recordatorios: se cancelan los anteriores y se reprograman.
6. Al **completar o eliminar**: se cancelan todas sus notificaciones.

```ts
// src/services/notifications.ts
import * as Notifications from 'expo-notifications';
import { subMinutes, isBefore } from 'date-fns';

export async function scheduleReminder(
  task: { id: string; title: string; dueAt: Date },
  offsetMinutes: number
): Promise<string | null> {
  const triggerDate = subMinutes(task.dueAt, offsetMinutes);
  if (isBefore(triggerDate, new Date())) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Tarea próxima a vencer',
      body: `"${task.title}" vence ${formatOffset(offsetMinutes)}.`,
      data: { taskId: task.id },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: 'reminders', // Android
    },
  });
}

export async function cancelReminder(notificationId: string) {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

function formatOffset(min: number): string {
  if (min % 1440 === 0) return `en ${min / 1440} día(s)`;
  if (min % 60 === 0) return `en ${min / 60} hora(s)`;
  return `en ${min} minuto(s)`;
}
```

### Opciones de recordatorio predefinidas
`5 min` · `15 min` · `30 min` · `1 h` · `3 h` · `12 h` · `1 día` · `2 días` · `1 semana` · **Personalizado** (el usuario ingresa número + unidad).

### Consideraciones por plataforma
- **iOS:** máximo **64 notificaciones locales** programadas a la vez. Si se supera, priorizar las más cercanas y reprogramar al abrir la app.
- **Android 13+:** requiere el permiso `POST_NOTIFICATIONS` en tiempo de ejecución.
- **Android 12+:** para avisos exactos puede requerirse `SCHEDULE_EXACT_ALARM`.
- **Android:** crear un canal de notificaciones (`reminders`) con importancia alta al iniciar la app.
- Al tocar la notificación, abrir directamente el detalle de la tarea (`data.taskId`).

---

## Instalación y ejecución

### Requisitos
- Node.js 20 o superior
- npm o pnpm
- App **Expo Go** en tu teléfono, o emulador Android / simulador iOS (macOS)
- Cuenta en [expo.dev](https://expo.dev) (para builds con EAS)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/<tu-usuario>/AppTareas.git
cd AppTareas

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npx expo start
```

Luego escanea el QR con Expo Go (Android) o la cámara (iOS).

> Expo Go tiene limitaciones con notificaciones en versiones recientes. Para probarlas de forma fiable usa un **development build**:
> ```bash
> npx expo install expo-dev-client
> eas build --profile development --platform android
> ```

### Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo |
| `npm test` | Tests unitarios (Jest) |
| `npm run typecheck` | Verificación de tipos |
| `npm run lint` | ESLint |
| `npm run db:generate` | Genera una migración tras cambiar `src/db/schema.ts` |

> Antes de publicar, cambia `com.tuusuario.taskalert` en `app.json` por tu propio identificador.

### Dependencias principales

```bash
npx expo install expo-notifications expo-sqlite expo-crypto expo-router \
  @react-native-community/datetimepicker @expo/vector-icons expo-dev-client
npm install drizzle-orm zustand date-fns react-hook-form zod @hookform/resolvers
npm install -D drizzle-kit babel-plugin-inline-import jest-expo jest @testing-library/react-native
```

---

## Configuración (`app.json`)

```json
{
  "expo": {
    "name": "TaskAlert",
    "slug": "taskalert",
    "scheme": "taskalert",
    "plugins": [
      "expo-router",
      "expo-sqlite",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#4F46E5"
        }
      ]
    ],
    "android": {
      "package": "com.tuusuario.taskalert",
      "permissions": ["POST_NOTIFICATIONS", "SCHEDULE_EXACT_ALARM"]
    },
    "ios": {
      "bundleIdentifier": "com.tuusuario.taskalert"
    }
  }
}
```

---

## Builds y publicación

```bash
npm install -g eas-cli
eas login
eas build:configure

# Android (APK para pruebas / AAB para Play Store)
eas build --platform android --profile preview
eas build --platform android --profile production

# iOS (requiere cuenta de Apple Developer)
eas build --platform ios --profile production

# Subir a las tiendas
eas submit --platform android
eas submit --platform ios
```

---

## Pruebas

```bash
npm test
```

Casos clave a cubrir:
- Cálculo correcto de `triggerDate` para cada offset.
- No programar recordatorios en el pasado.
- Reprogramación al editar fecha de entrega.
- Cancelación al completar / eliminar tareas.
- Validación del formulario (título obligatorio, fecha futura).

---

## Roadmap

- [x] Configurar proyecto Expo + TypeScript + Expo Router
- [x] Base de datos SQLite y esquema con Drizzle
- [x] CRUD de tareas
- [x] Permisos y canal de notificaciones
- [x] Recordatorio por defecto de 1 día
- [x] Selector de recordatorios personalizados
- [x] Ajustes de recordatorios por defecto
- [x] Navegación desde la notificación al detalle
- [x] Tests unitarios
- [ ] Build de Android e iOS
- [ ] Publicación en Play Store / App Store

---

## Contribuir

1. Haz un fork del proyecto.
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`.
3. Haz commit: `git commit -m "feat: agrega nueva funcionalidad"` (Conventional Commits).
4. Haz push: `git push origin feature/nueva-funcionalidad`.
5. Abre un Pull Request.

---

## Licencia

MIT © 2026 Sebastian Parra
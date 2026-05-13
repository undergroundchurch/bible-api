const { register } = require('./Auth')

/**
 * Seed script to create initial users in the users.db
 */
const initialUsers = [
  { username: 'admin', password: 'admin' },
  { username: 'tlabs', password: 'tlabs' },
  { username: 'testuser', password: 'testuser' },
  { username: 'crtonussi', password: 'crtonussi' },
]

function createUsers() {
  console.log('--- User Seeding Started ---')

  initialUsers.forEach((user) => {
    try {
      const result = register(user.username, user.password)
      console.log(
        `[SUCCESS] Created user: ${result.username} (ID: ${result.id})`
      )
    } catch (err) {
      if (err.message === 'Username already exists') {
        console.log(`[SKIP] User already exists: ${user.username}`)
      } else {
        console.error(
          `[ERROR] Failed to create user ${user.username}:`,
          err.message
        )
      }
    }
  })

  console.log('--- User Seeding Completed ---')
  process.exit(0)
}

createUsers()

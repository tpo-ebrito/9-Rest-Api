/* eslint-env mocha */

const { expect } = require('chai')
const { Courses, Users } = require('./models')
const axios = require('axios')

function createConfig (username, password, url, method, data) {
  const token = `${username}:${password}`
  const encodedToken = Buffer.from(token).toString('base64')
  return { method, url, data, headers: { Authorization: 'Basic ' + encodedToken } }
}

describe('The Courses Model', function () {
  let actual
  before('testing courses model', async () => {
    actual = await Courses.findOne()
  })
  it('should have a title attribute', async () => {
    expect(actual).to.have.property('title')
  })

  it('should have a description attribute', async () => {
    expect(actual).to.have.property('description')
  })

  // Route tests
  describe('testing users route', async () => {
    let actual
    before('testing users route', async () => {
      const axiosConfig = createConfig('joe@smith.com', 'joepassword', 'http://localhost:5000/api/users', 'get')
      actual = await axios(axiosConfig)
    })

    it('GET users should have status code of 200', async () => {
      const expected = 200
      // console.log(actual)
      expect(actual.status).to.equal(expected)
    })

    it('GET users should return current authenticated user', async () => {
      const expected = 'joe@smith.com'
      actual = actual.data.user[0].emailAddress
      expect(actual).to.equal(expected)
    })

    it('POST users will create a new user status code of 201', async () => {
      const newUser = {
        firstName: 'testFirst',
        lastName: 'testLast',
        emailAddress: 'test1@email.com',
        password: 'password'
      }
      actual = await axios.post('http://localhost:5000/api/users', newUser)
      const expected = 201
      expect(actual.status).to.equal(expected)
    })
    it('new user should exist', async () => {
      const actual = await Users.findOne({ where: { emailAddress: 'test1@email.com' } })
      const expected = 'test1@email.com'
      expect(actual.emailAddress).to.equal(expected)
    })
    it('response header location set to / ', async () => {
      const expected = '/'
      expect(actual.headers.location).to.equal(expected)
    })
    it('POST user password must be hashed', async () => {
      const user = await Users.findOne({ where: { firstName: 'testFirst' } })
      actual = user.password
      expect(actual).to.not.equal('password')
    })
  })
  /**
 * Courses Routes
 */
  describe('testing courses route', () => {
    let response

    // get route tests

    it('GET must return a status code of 200', async () => {
      response = await axios.get('http://localhost:5000/api/courses')
      const actual = response.status
      const expected = 200
      expect(actual).to.equal(expected)
    })
    it('GET must return a list of all courses and user', async () => {
      const actual = response.data.courses[2].User.emailAddress
      const expected = 'sally@jones.com'
      expect(actual).to.equal(expected)
    })
    it('Get should return a status code of 200', async () => {
      response = await axios.get('http://localhost:5000/api/courses/3')
      const actual = response.status
      const expected = 200
      expect(actual).to.equal(expected)
    })
    it('GET should return specific course with owner', async () => {
      const actual = response.data.course[0].User.emailAddress
      const expected = 'sally@jones.com'
      expect(actual).to.equal(expected)
    })

    // post route tests

    it('POST should require title', async () => {
      const expected = 'Please provide a title'
      try {
        const newCourse = {
          userId: 1,
          title: '',
          description: 'Test description'
        }
        const axiosConfig = createConfig('joe@smith.com', 'joepassword', 'http://localhost:5000/api/courses', 'post', newCourse)
        response = await axios(axiosConfig)
      } catch (error) {
        actual = error.response.data.errors[0]
      }
      expect(actual).to.equal(expected)
    })
    it('POST should require description', async () => {
      const expected = 'Please provide a description'
      try {
        const newCourse = {
          userId: 1,
          title: 'Test Title',
          description: ''
        }
        const axiosConfig = createConfig('joe@smith.com', 'joepassword', 'http://localhost:5000/api/courses', 'post', newCourse)
        response = await axios(axiosConfig)
      } catch (error) {
        actual = error.response.data.errors[0]
      }
      expect(actual).to.equal(expected)
    })
    it('POST should create new course', async () => {
      const newCourse = {
        userId: 1,
        title: 'Test Course',
        description: 'Test description'
      }
      const axiosConfig = await createConfig('joe@smith.com', 'joepassword', 'http://localhost:5000/api/courses', 'post', newCourse)
      response = await axios(axiosConfig)
      const testCourse = await Courses.findOne({ where: { title: 'Test Course' } })
      const actual = testCourse.title
      const expected = "Test Course"
      expect(actual).to.equal(expected)
    })
    it('POST should return a status code of 201', async () => {
      const actual = response.status
      const expected = 201
      expect(actual).to.equal(expected)
    })
    it('POST must redirect to the new course', async () => {
      const actual = response.headers.location
      const testCourse = await Courses.findOne({ where: { title: 'Test Course' } })
      const expected = '/courses/' + testCourse.id
      expect(actual).to.equal(expected)
    })
    it('POST must require the firstName field', async () => {
      const expected = 'Please provide a first name'
      try {
        const newUser1 = {
          firstName: '',
          lastName: 'testLast',
          emailAddress: 'test1@email.com',
          password: 'testpassword'
        }
        await axios.post('http://localhost:5000/api/users', newUser1)
      } catch (error) {
        actual = error.response.data.errors[0]
      }
      expect(actual).to.equal(expected)
    })
    it('POST must require the lastName field', async () => {
      const expected = 'Please provide a last name'
      try {
        const newUser1 = {
          firstName: 'testFirst',
          lastName: '',
          emailAddress: 'test1@email.com',
          password: 'testpassword'
        }
        await axios.post('http://localhost:5000/api/users', newUser1)
      } catch (error) {
        actual = error.response.data.errors[0]
      }
      expect(actual).to.equal(expected)
    })
    it('POST must require a valid email', async () => {
      const expected = 'Please provide a valid email address'
      try {
        const newUser1 = {
          firstName: 'testFirst',
          lastName: 'testLast',
          emailAddress: 'test1email.co',
          password: 'testPassword'
        }
        await axios.post('http://localhost:5000/api/users', newUser1)
      } catch (error) {
        actual = error.response.data.errors[0]
      }
      expect(actual).to.equal(expected)
    })
    it('POST must require a valid password', async () => {
      const expected = 'A password is required'
      try {
        const newUser1 = {
          firstName: 'testFirst',
          lastName: 'testLast',
          emailAddress: 'test1@email.com',
          password: ''
        }
        await axios.post('http://localhost:5000/api/users', newUser1)
      } catch (error) {
        actual = error.response.data.errors[0]
      }
      expect(actual).to.equal(expected)
    })
    it('POST must notify if email exists', async () => {
      const expected = 'That email address already exists'
      try {
        const newUser1 = {
          firstName: 'testFirst',
          lastName: 'testLast',
          emailAddress: 'test1@email.com',
          password: 'testpassword'
        }
        await axios.post('http://localhost:5000/api/users', newUser1)
      } catch (error) {
        actual = error.response.data.errors[0]
      }
      expect(actual).to.equal(expected)
    })
    // PUT test route

    it('PUT must return title validation', async () => {
      const expected = 'Please provide a title'
      try {
        const testCourse = await Courses.findOne({ where: { title: 'Test Course' } })
        const updateCourse = {
          title: '',
          description: 'New description'
        }
        const axiosConfig = createConfig('joe@smith.com', 'joepassword', 'http://localhost:5000/api/courses/' + testCourse.id, 'put', updateCourse)
        response = await axios(axiosConfig)
      } catch (error) {
        actual = error.response.data.errors[0]
      }
      expect(actual).to.equal(expected)
    })
    it('PUT update title must return 400 status code upon fail', async () => {
      const expected = 400
      try {
        const testCourse = await Courses.findOne({ where: { title: 'Test Course' } })
        const updateCourse = {
          title: '',
          description: 'title'
        }
        const axiosConfig = createConfig('joe@smith.com', 'joepassword', 'http://localhost:5000/api/courses/' + testCourse.id, 'put', updateCourse)
        response = await axios(axiosConfig)
      } catch (error) {
        actual = error.response.status
      }
      expect(actual).to.equal(expected)
    })
    it('PUT must return description validation ', async () => {
      const expected = 'Please provide a description'
      try {
        const testCourse = await Courses.findOne({ where: { title: 'Test Course' } })
        const updateCourse = {
          title: 'New title',
          description: ''
        }
        const axiosConfig = createConfig('joe@smith.com', 'joepassword', 'http://localhost:5000/api/courses/' + testCourse.id, 'put', updateCourse)
        response = await axios(axiosConfig)
      } catch (error) {
        actual = error.response.data.errors[0]
      }
      expect(actual).to.equal(expected)
    })
    it('PUT update description must return 400 status code upon fail', async () => {
      const expected = 400
      try {
        const testCourse = await Courses.findOne({ where: { title: 'Test Course' } })
        const updateCourse = {
          title: 'New Title',
          description: ''
        }
        const axiosConfig = createConfig('joe@smith.com', 'joepassword', 'http://localhost:5000/api/courses/' + testCourse.id, 'put', updateCourse)
        response = await axios(axiosConfig)
      } catch (error) {
        actual = error.response.status
      }
      expect(actual).to.equal(expected)
    })
    // DELETE test route

    it('DELETE must delete the selected course and return 204 status code', async () => {
      const testCourse = await Courses.findOne({ where: { title: 'Test Course' } })
      const axiosConfig = createConfig('joe@smith.com', 'joepassword', 'http://localhost:5000/api/courses/' + testCourse.id, 'delete')
      response = await axios(axiosConfig)
      const actual = response.status
      const expected = 204
      expect(actual).to.equal(expected)
    })
  })
  // Middleware Authentication
  describe('Middleware Authentication Tests', () => {
    let actual

    it('GET users route must return Access Denied', async () => {
      const expected = 'Access Denied'
      try {
        await axios.get('http://localhost:5000/api/users')
      } catch (error) {
        actual = error.response.data.msg
      }
      expect(actual).to.equal(expected)
    })

    it('GET user route must return 401 status code', async () => {
      const expected = 401
      try {
        await axios.get('http://localhost:5000/api/users')
      } catch (error) {
        actual = error.response.status
      }
      expect(actual).to.equal(expected)
    })
    it('POST courses route must return Access Denied', async () => {
      const expected = 'Access Denied'
      try {
        const newCourse2 = {
          userId: 2,
          title: 'Test Course 2',
          description: 'Test description'
        }
        const axiosConfig = await createConfig('', '', 'http://localhost:5000/api/courses', 'post', newCourse2)
        await axios(axiosConfig)
      } catch (error) {
        actual = error.response.data.msg
      }
      expect(actual).to.equal(expected)
    })
    it('PUT courses route must return Access Denied', async () => {
      const expected = 'Access denied'
      try {
        const testCourse = await Courses.findOne({ where: { title: 'Learn How to Program' } })
        const updateCourse = {
          title: 'New Title',
          description: 'New description'
        }
        const axiosConfig = createConfig('joe@smith.com', 'joepassword', 'http://localhost:5000/api/courses/' + testCourse.id, 'put', updateCourse)
        await axios(axiosConfig)
      } catch (error) {
        actual = error.response.data.msg
      }
      expect(actual).to.equal(expected)
    })
    it('DELETE another users course must return Access Denied', async () => {
      const expected = 'Access denied'
      try {
        const testCourse = await Courses.findOne({ where: { title: 'Learn How to Program' } })
        const axiosConfig = createConfig('joe@smith.com', 'joepassword', 'http://localhost:5000/api/courses/' + testCourse.id, 'delete')
        await axios(axiosConfig)
      } catch (error) {
        actual = error.response.data.msg
      }
      expect(actual).to.equal(expected)
    })

    after('delete test user', async () => {
      const testUser = await Users.findOne({ where: { emailAddress: 'test1@email.com' } })
      await testUser.destroy()
    })
  })
})

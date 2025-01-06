import React, { useState, useEffect } from 'react'
import react from '../assets/LoginPage/fresco_logo_black.png'

import leaf_1 from '../assets/LoginPage/leaf-1.png'
import leaf_2 from '../assets/LoginPage/leaf-2.png'
import leaf_3 from '../assets/LoginPage/leaf-3.png'

function LoginPage() {
  const [form_data, set_form_data] = useState({
    id_number: '',
    password: ''
  })

  const handle_submit = async (e) => {
    e.preventDefault()
    // Backend integration will be handled by backend developer
    console.log('Form submitted:', form_data)
  }

  const handle_change = (e) => {
    set_form_data({
      ...form_data,
      [e.target.name]: e.target.value
    })
  }

  // Prevent scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto' // Restore scrolling when the component unmounts
    }
  }, [])

  return (
    <div className="min-h-screen w-full relative bg-white p-6">
      {/* Logo */}
      <div className="absolute top-8 left-8">
        <img
          src={react}
          alt="Fresco Logo"
          className="w-60 object-contain"
        />
      </div>

      {/* Decorative Leaves */}
      <img
        src={leaf_1}
        alt="Decorative Leaf"
        className="absolute bottom-0 left-10 w-80 opacity-70"
      />
      <img
        src={leaf_3}
        alt="Decorative Leaf"
        className="absolute top-[-6rem] right-20 opacity-70"
      />
      <img
        src={leaf_2}
        alt="Decorative Leaf"
        className="absolute bottom-[-8rem] right-10 w-25 opacity-70"
      />

      {/* Login Form */}
      <div className="flex justify-center items-center">
        <div className="w-full max-w-[384px] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <h1 className="text-5xl font-bold text-center text-gray-800 mb-10">Log In</h1>
          <div className="bg-white shadow-md rounded-lg p-8">
            <form onSubmit={handle_submit} className="space-y-4">
              <div>
                <label htmlFor="id_number" className="block text-sm font-medium text-gray-700">ID Number</label>
                <input
                  type="text"
                  id="id_number"
                  name="id_number"
                  value={form_data.id_number}
                  onChange={handle_change}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                            focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={form_data.password}
                  onChange={handle_change}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                            focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Log In
              </button>
              <div className="text-sm text">
                <a href="#" className="font-medium text-gray-600 hover:text-gray-900">
                  Forgot password?
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

"use client"
import React from 'react'
import type { AppCode } from '@/types/auth'
import LoginForm from './LoginForm'

interface Props {
  app?: AppCode
}

export default function LoginPanel({ app }: Props) {
  return (
    <div className="l-stack">
      <LoginForm app={app} />
    </div>
  )
}

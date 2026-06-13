import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../supabaseClient'
import styles from './ProfileSection.module.scss'
import ProfileSkeleton from './ProfileSkeleton/ProfileSkeleton'
import eyeSvg from '../../../img/eye.svg'
import eyeOffSvg from '../../../img/eye-off.svg'
import logoutSvg from '../../../img/logout.svg'
import basketSvg from '../../../img/basket.svg'

interface Props {
  onUpdate: (name: string, avatarUrl: string | null) => void
}

type MsgType = { text: string; ok: boolean } | null

function ProfileSection({ onUpdate }: Props) {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [userId, setUserId] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')

  const [nameMsg, setNameMsg] = useState<MsgType>(null)
  const [emailMsg, setEmailMsg] = useState<MsgType>(null)
  const [passMsg, setPassMsg] = useState<MsgType>(null)
  const [avatarMsg, setAvatarMsg] = useState<MsgType>(null)


  const [savingName, setSavingName] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingPass, setSavingPass] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user
      if (!u) return
      setUserId(u.id)
      setName(u.user_metadata?.full_name ?? '')
      setEmail(u.email ?? '')
      setAvatarUrl(u.user_metadata?.avatar_url ?? null)
      setLoading(false)
    })
  }, [])

  if (loading) return <ProfileSkeleton />

  const flash = (set: (m: MsgType) => void, msg: MsgType) => {
    set(msg)
    setTimeout(() => set(null), 4000)
  }

  const saveName = async () => {
    if (!name.trim()) return
    setSavingName(true)
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } })
    setSavingName(false)
    if (error) flash(setNameMsg, { text: error.message, ok: false })
    else {
      flash(setNameMsg, { text: 'Имя сохранено', ok: true })
      onUpdate(name.trim(), avatarUrl)
    }
  }

  const saveEmail = async () => {
    if (!email.trim()) return
    setSavingEmail(true)
    const { error } = await supabase.auth.updateUser({ email: email.trim() })
    setSavingEmail(false)
    if (error) flash(setEmailMsg, { text: error.message, ok: false })
    else flash(setEmailMsg, { text: 'Письмо с подтверждением отправлено', ok: true })
  }

  const savePassword = async () => {
    if (newPassword !== confirmPassword) {
      flash(setPassMsg, { text: 'Пароли не совпадают', ok: false })
      return
    }
    if (newPassword.length < 6) {
      flash(setPassMsg, { text: 'Минимум 6 символов', ok: false })
      return
    }
    setSavingPass(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPass(false)
    if (error) flash(setPassMsg, { text: error.message, ok: false })
    else {
      setNewPassword('')
      setConfirmPassword('')
      flash(setPassMsg, { text: 'Пароль изменён', ok: true })
    }
  }

  const resizeToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)
      img.onload = () => {
        const SIZE = 200
        const canvas = document.createElement('canvas')
        canvas.width = SIZE
        canvas.height = SIZE
        const ctx = canvas.getContext('2d')!
        const scale = Math.max(SIZE / img.width, SIZE / img.height)
        const w = img.width * scale
        const h = img.height * scale
        ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h)
        URL.revokeObjectURL(objectUrl)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = objectUrl
    })

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const base64 = await resizeToBase64(file)
      const { error } = await supabase.auth.updateUser({ data: { avatar_url: base64 } })
      if (error) { flash(setAvatarMsg, { text: error.message, ok: false }); return }
      setAvatarUrl(base64)
      flash(setAvatarMsg, { text: 'Аватар обновлён', ok: true })
      onUpdate(name, base64)
    } catch {
      flash(setAvatarMsg, { text: 'Не удалось обработать изображение', ok: false })
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'УДАЛИТЬ') return
    await supabase.from('projects').delete().eq('user_id', userId)
    await supabase.auth.signOut()
    navigate('/auth')
  }

  const initial = name.charAt(0).toUpperCase() || '?'

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <p className={styles.breadcrumb}>/ Аккаунт</p>
        <h1 className={styles.title}>Профиль</h1>
        <p className={styles.subtitle}>Управляйте своим аккаунтом и настройками.</p>
      </div>

      <div className={styles.columns}>
        {/* ── Avatar card ── */}
        <div className={styles.card}>
          <div className={styles.avatarSection}>
            <div className={styles.avatarWrap} onClick={() => fileInputRef.current?.click()} title="Нажмите, чтобы сменить фото">
              {uploadingAvatar ? (
                <div className={styles.avatarPlaceholder}>
                  <svg className={styles.spinner} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                </div>
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className={styles.avatarImg} />
              ) : (
                <div className={styles.avatarPlaceholder}>{initial}</div>
              )}
              <div className={styles.avatarOverlay}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
            <span className={styles.avatarName}>{name || 'Пользователь'}</span>
            <span className={styles.avatarEmail}>{email}</span>
            {avatarMsg && <span className={avatarMsg.ok ? styles.msgOk : styles.msgErr}>{avatarMsg.text}</span>}
            <p className={styles.avatarHint}>Нажмите на фото чтобы изменить</p>
          </div>
        </div>

        {/* ── Left column ── */}
        <div className={styles.leftCol}>
          <div className={styles.card}>
            <div className={styles.field}>
              <label className={styles.label}>Имя</label>
              <div className={styles.fieldRow}>
                <input className={`${styles.input} ${nameMsg?.ok ? styles.inputSuccess : ''}`} value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveName()} placeholder="Ваше имя" />
                <button className={styles.saveBtn} onClick={saveName} disabled={savingName}>{savingName ? '...' : 'Сохранить'}</button>
              </div>
              {nameMsg && <span className={nameMsg.ok ? styles.msgOk : styles.msgErr}>{nameMsg.text}</span>}
            </div>

            <div className={styles.divider} />

            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <div className={styles.fieldRow}>
                <input className={`${styles.input} ${emailMsg?.ok ? styles.inputSuccess : ''}`} type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveEmail()} placeholder="email@example.com" />
                <button className={styles.saveBtn} onClick={saveEmail} disabled={savingEmail}>{savingEmail ? '...' : 'Сохранить'}</button>
              </div>
              {emailMsg && <span className={emailMsg.ok ? styles.msgOk : styles.msgErr}>{emailMsg.text}</span>}
            </div>

            <div className={styles.divider} />

            <div className={styles.field}>
              <label className={styles.label}>Смена пароля</label>
              <div className={styles.passwordWrap}>
                <input className={`${styles.input} ${passMsg?.ok ? styles.inputSuccess : ''}`} type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Новый пароль" />
                <button className={styles.eyeBtn} onClick={() => setShowPassword(p => !p)}>
                  <img src={showPassword ? eyeOffSvg : eyeSvg} alt="" width="16" height="16" />
                </button>
              </div>
              <div className={styles.passwordWrap} style={{ marginTop: 8 }}>
                <input className={`${styles.input} ${passMsg?.ok ? styles.inputSuccess : ''}`} type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && savePassword()} placeholder="Повторите пароль" />
                <button className={styles.eyeBtn} onClick={() => setShowConfirm(p => !p)}>
                  <img src={showConfirm ? eyeOffSvg : eyeSvg} alt="" width="16" height="16" />
                </button>
              </div>
              {passMsg && <span className={passMsg.ok ? styles.msgOk : styles.msgErr} style={{ marginTop: 4 }}>{passMsg.text}</span>}
              <button className={styles.saveBtnFull} onClick={savePassword} disabled={savingPass || !newPassword} style={{ marginTop: 8 }}>
                {savingPass ? 'Сохраняем...' : 'Изменить пароль'}
              </button>
            </div>
          </div>

          <div className={styles.dangerCard}>
            <div className={styles.dangerHeader}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Опасная зона
            </div>
            <div className={styles.dangerActions}>
              <button className={styles.logoutBtn} onClick={handleLogout}>
                <img src={logoutSvg} alt="" width="15" height="15" />
                Выйти из аккаунта
              </button>
              <button className={styles.deleteAccountBtn} onClick={() => setShowDeleteModal(true)}>
                <img src={basketSvg} alt="" width="15" height="15" />
                Удалить аккаунт
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className={styles.overlay} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon}>
              <img src={basketSvg} alt="" width="28" height="28" style={{ filter: 'invert(27%) sepia(90%) saturate(800%) hue-rotate(330deg) brightness(90%)' }} />
            </div>
            <h2 className={styles.modalTitle}>Удалить аккаунт?</h2>
            <p className={styles.modalText}>
              Все ваши проекты будут удалены навсегда. Это действие нельзя отменить.
            </p>
            <p className={styles.modalHint}>Введите <strong>УДАЛИТЬ</strong> для подтверждения:</p>
            <input
              className={styles.input}
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="УДАЛИТЬ"
              autoFocus
            />
            <div className={styles.modalBtns}>
              <button className={styles.cancelBtn} onClick={() => { setShowDeleteModal(false); setDeleteInput('') }}>
                Отмена
              </button>
              <button
                className={styles.confirmDeleteBtn}
                onClick={handleDeleteAccount}
                disabled={deleteInput !== 'УДАЛИТЬ'}
              >
                Удалить навсегда
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileSection

import { getOptionIndex, getOptionValue } from './puppeteer/utils'
import { closePage, newPage, pageCache } from './puppeteer/page'

export interface StartInput {
  student: {
    id: string
    fullName: string
    phone: string
    dorm: 'מעונות איינשטיין' | 'מעונות ברושים'
    building: string
    floor: string
    apartmentNumber: string
    side: 'ימין' | 'שמאל'
  }
  category: 'פניות בנושא מבקרים' | 'פניות בנושא לינה'
  guest: {
    id: string
    fullName: string
    phone: string
  }
}

export const startRequest = async (input: StartInput) => {
  try {
    const { page, pageId } = await newPage()

    await page.goto('https://meonot.shikunbinui.com/')

    // Full Name
    await page.waitForSelector('[name=FullName]')
    await page.type('[name=FullName]', input.student.fullName)

    // Phone
    await page.waitForSelector('[name=Phone]')
    await page.type('[name=Phone]', input.student.phone)

    // Dorm
    await page.waitForSelector('[name=DormDropDown]')
    await page.select(
      '[name=DormDropDown]',
      await getOptionValue(page, '[name=DormDropDown]', input.student.dorm)
    )

    // Building
    await page.waitForSelector('[name=DropDownBuilding]')
    await page.select(
      '[name=DropDownBuilding]',
      await getOptionValue(
        page,
        '[name=DropDownBuilding]',
        input.student.building
      )
    )

    // Floor
    await page.waitForSelector('[name=DropDownFloor]')
    await page.select(
      '[name=DropDownFloor]',
      await getOptionValue(page, '[name=DropDownFloor]', input.student.floor)
    )

    // Apartment Number
    await page.waitForSelector('.select2-selection')
    await page.click('.select2-selection', { delay: 100 })
    const optionIndex = await getOptionIndex(
      page,
      '.select2-results',
      input.student.apartmentNumber
    )
    await page.click(`.select2-results__option:nth-child(${optionIndex})`)

    // Side
    await page.waitForSelector('[name=DropDownSide]')
    await page.select('[name=DropDownSide]', input.student.side)

    // Category
    await page.waitForSelector('[name=DropDownFaultCategory]')
    await page.select(
      '[name=DropDownFaultCategory]',
      await getOptionValue(page, '[name=DropDownFaultCategory]', input.category)
    )
    await page.waitForNetworkIdle()

    // ID
    await page.waitForSelector('[name=ID_TB]')
    await page.type('[name=ID_TB]', input.student.id)

    // Entrance Date
    const today = new Date().toLocaleDateString('en-GB')
    await page.waitForSelector('[name=EntranceDate_TB]')
    await page.type('[name=EntranceDate_TB]', today)

    // Leave Date
    if (input.category === 'פניות בנושא לינה') {
      const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString(
        'en-GB'
      )
      await page.waitForSelector('[name=LeaveDate_TB]')
      await page.type('[name=LeaveDate_TB]', tomorrow)
    }

    // Guest ID
    await page.waitForSelector('[name=GuestID_TB]')
    await page.type('[name=GuestID_TB]', input.guest.id)

    // Guest Name
    await page.waitForSelector('[name=GuestName_TB]')
    await page.type('[name=GuestName_TB]', input.guest.fullName)

    // Guest Phone
    await page.waitForSelector('[name=GuestPhone_TB]')
    await page.type('[name=GuestPhone_TB]', input.guest.phone)

    // Captcha
    await page.waitForSelector('.BDC_CaptchaImageDiv')
    const captchaEl = await page.$('.BDC_CaptchaImageDiv')
    await captchaEl?.screenshot({ path: `captchas/${pageId}.png` })

    // Auto close instance after 30 seconds
    setTimeout(() => {
      closePage(pageId)
    }, 30 * 1000)

    return pageId
  } catch (err) {
    console.error(err)
    throw `אירעה שגיאה, יש לנסות שוב (${err})`
  }
}

export const solveCaptchaAndSubmit = async (pageId: string, answer: string) => {
  try {
    const page = pageCache[pageId]
    if (!page) {
      throw 'עמוד נסגר אוטומטית, יש לנסות שוב'
    }
    await page.type('[name=CaptchaCodeTextBox]', answer)
    await page.click('[name=Button1]')
    await Promise.race([
      page.waitForSelector('#lblResult'),
      page.waitForSelector('#doneProgras'),
    ])
    const { color, msg } = await page.evaluate(() => {
      const errorEl = document.getElementById('lblResult')
      const successEl = document.getElementById('doneProgras')
      if (errorEl) {
        return {
          color: errorEl.style.color,
          msg: errorEl.textContent,
        }
      } else if (successEl) {
        return {
          color: successEl.style.color,
          msg: successEl.textContent,
        }
      } else return {}
    })
    if (color === 'red') {
      closePage(pageId)
      throw msg
    } else if (color === 'green') {
      closePage(pageId)
      return msg
    }
    closePage(pageId)
  } catch (err) {
    console.error(err)
    throw err
  }
}

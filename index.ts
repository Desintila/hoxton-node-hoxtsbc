import { PrismaClient } from "@prisma/client"
import cors from "cors"
import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const app = express()
app.use(cors())
app.use(express.json())

const prisma = new PrismaClient()

app.post('/register', async (req, res) => {
    const { email, fullName, password } = req.body
    try {
        const hashedPassword = bcrypt.hashSync(password, 10)

        const user = await prisma.user.create({
            data: {
                email: email, fullname: fullName, password: hashedPassword, amountInAccount: Math.floor(Math.random() * 1000),
                transactions: {
                    create: {
                        amount: 500,
                        currency: '$',
                        isPositive: false,
                        receiverOrSender: 'receiver',
                        completedAt: '01/15/2022'
                    }
                }
            }

        })
        //@ts-ignore
        const token = jwt.sign({ id: user.id }, process.env.My_Secret)
        res.send({ user, token: token })
    }
    catch (error) {
        //@ts-ignore
        res.status(400).send({ error: error.message })
    }

})


app.post('/login', async (req, res) => {
    const { email, password } = req.body
    try {
        const user = await prisma.user.findUnique({ where: { email: email }, include: { transactions: true } })
        //@ts-ignore
        const passwordMatch = bcrypt.compareSync(password, user.password)
        if (user && passwordMatch) {
            //@ts-ignore
            const token = jwt.sign({ id: user.id }, process.env.My_Secret)
            res.send({ user, token: token })
        }
        else {
            throw Error('Something went wrong!')
        }
    }
    catch (error) {
        //@ts-ignore
        res.status(400).send({ error: 'User or password invalid' })
    }

})


app.get('/banking-info', async (req, res) => {
    const token = req.headers.authorization
    try {
        //@ts-ignore
        const decodedData = jwt.verify(token, process.env.My_Secret)
        //@ts-ignore
        const user = await prisma.user.findUnique({ where: { id: decodedData.id }, include: { transactions: true } })
        res.send({ data: user })
    }
    catch (error) {
        //@ts-ignore
        res.status(400).send({ error: 'User or password invalid' })
    }
})



app.listen(4000, () => {
    console.log('Server running: http://localhost:4000')
})
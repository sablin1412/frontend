using System;

class Program
{
    static void Main()
    {
        const int daysInMay = 31;
        int startDayOfWeek = 0;
        int dayOfMonth = 0;
        
        while (true)
        {
            Console.Write("Введите номер дня недели, с которого начинается май (1 - пн,...,7 - вс): ");
            string input = Console.ReadLine();
            if (!int.TryParse(input, out startDayOfWeek) || startDayOfWeek < 1 || startDayOfWeek > 7)
            {
                Console.WriteLine("Ошибка! Введите целое число от 1 до 7.");
            }
            else
            {
                break;
            }
        }

        while (true)
        {
            Console.Write("Введите день месяца: ");
            string input = Console.ReadLine();
            if (!int.TryParse(input, out dayOfMo5
            nth) || dayOfMonth < 1 || dayOfMonth > daysInMay)
            {
                Console.WriteLine("Ошибка! Введите целое число от 1 до 31.");
            }
            else
            {
                break;
            }
        }

        bool isWeekend = false;

        int dayOfWeekForDay = (startDayOfWeek + dayOfMonth - 2) % 7 + 1; 

        if ((dayOfMonth >= 1 && dayOfMonth <= 5) || (dayOfMonth >= 8 && dayOfMonth <= 10))
        {
            isWeekend = true;
        }

        else if (dayOfWeekForDay == 6 || dayOfWeekForDay == 7) 
        {
            isWeekend = true;
        }

        Console.WriteLine("Проверяем, выходной ли день...");
        Console.WriteLine(isWeekend ? "Выходной день" : "Рабочий день");
    }
}

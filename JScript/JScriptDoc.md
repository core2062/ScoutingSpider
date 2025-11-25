JScript Extended Java-Syntax Runtime
A mini-language that allows writing Java-style classes inside <JScript> tags or .JScript files, which are converted at runtime into normal JavaScript.

Overview

JScript extends JavaScript with:

Java-style classes (“public class Example { ... }”)

PascalCase API wrappers

DOM manipulation with Java-like syntax

Auto-conversion into real JavaScript

Supports src="File.JScript" external files

Requires Example.Run(args) entry method

Everything inside <JScript> or .JScript files is treated as Java-syntax.
Normal <script> tags remain normal JavaScript.

Example:
<JScript src="Demo.JScript">
Example.Run(null);
</JScript>

Basic Syntax Rules

Entry point requirement:
public class Example {
public static void Run(String[] Args) { }
}

Variables:
int Count = 5;
String Name = "Adam";
var Mixed = Document.GetElementById("main");

Methods:
public static void SayHi(String Msg) {
Console.Log(Msg);
}

Supported Types

int → number
long → number
double → number
float → number
String → string
boolean → boolean
var → auto
void → undefined

DOM API Wrapper (PascalCase)

Use familiar DOM commands, but in PascalCase:

Get Elements:
var MainDiv = Document.GetElementById("main");
var Btn = Document.QuerySelector("#button");

Modify:
MainDiv.InnerText = "Hello from JScript!";
MainDiv.InnerHTML = "<b>Bold</b>";

Append:
MainDiv.AppendChild(NewNode);

Create nodes:
var NewNode = Document.CreateElement("p");
NewNode.InnerText = "Text";
Document.Body.AppendChild(NewNode);

Built-In Standard Library

Console:
Console.Log("Hello");
Console.Warn("Careful!");
Console.Error("Oops!");

Math:
int R = Math.RandomInt(1, 10);
double X = Math.Sqrt(144);

System:
System.Sleep(500);

File (browser safe):
File.ReadText("data.txt", (Text) -> {
Console.Log(Text);
});

Collections:
List<String> Names = new List<String>();
Names.Add("Adam");
Names.Add("Eve");

Multiple Classes Per File

Allowed:
public class A { }
public class B { }
public class C { }

Full Example (.JScript File)

public class Example {
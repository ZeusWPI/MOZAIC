# This file will help you start build your own bot in a specific language

## Java
The game communicates in JSON so you need to be able to parse JSON.
The easiest way is to use a JSON library. Java doesn't have default JSON support, so to install:  
Download the jar from http://www.java2s.com/Code/JarDownload/java/java-json.jar.zip.  
Next extract the jar to somewhere of your choosing  
Tell your ide to use it.
In Intellij go to File -> Project Structure -> Global Libraries
Press the green plus sign and select the jar.
Next Intellij will ask you to add it to your project, say "yes please kind Intellij".  

After your code is ready, export to jar with all dependencies.
In Intellij:
Go to File -> Project Structure -> Artifacts
Press the green plus sign and select Jar -> From modules with dependencies
Fill in your main class (with packages)
Press ok till it is done.

Your jar is in out/artifacts/<projectName>_jar/<projectName>.jar
java -jar 

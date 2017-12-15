import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Observable } from 'rxjs/Rx';
import { VoiceService } from './../services/voice.service';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from 'app/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { EmailService } from 'app/services/email.service';
import { EntertainmentService } from 'app/services/entertainment.service';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.css']
})
export class ShellComponent implements OnInit {
  speaking: boolean = true;
  listening: boolean = false;

  emailMenuInput(emails) {
    this.toggleListen(true);
    this.voiceService.listen()
      .then((result: string) => {
        this.toggleListen(false);
        if (result.split(' ').length !== 1 && result.match(/\d+/))
          result = result.match(/\d+/).join('');

        console.log(result);
        if (this.voiceService.keywordMatch(result, 'number')) {
          // alert('parts' in emails.messages[parseInt(result) - 1].payload);
          if ('parts' in emails.messages[parseInt(result) - 1].payload) {
            let mail = this.emailService.decodeEmail((emails.messages[parseInt(result) - 1]).payload.parts[0].body.data);
            this.toggleSpeak(true);
            this.voiceService.speak(mail, 'female', null, () => {
              return this.voiceService.speak('I have finished reading your email. Please speak another number, or more, to fetch more emails', 'female', null, () => {
                this.toggleSpeak(false);
                this.emailMenuInput(emails)
              });
            });
          } else {
            let mail = this.emailService.decodeEmail((emails.messages[parseInt(result) - 1]).payload.body.data);
            alert(mail);
            this.toggleSpeak(true);
            this.voiceService.speak(mail, 'female', null, () => {
              return this.voiceService.speak('I have finished reading your email. Please speak another number, or more, to fetch more emails', 'female', null, () => {
                this.toggleSpeak(false);
                this.emailMenuInput(emails)
              });
            });
          }
          // console.log('Email', this.emailService.decodeEmail((emails.messages[parseInt(result) - 1]).payload.parts[0].body.data))
        } else if (this.voiceService.keywordMatch(result, 'return')) {
          return (() => {
            this.toggleSpeak(true);
            this.voiceService.speak('Returning to previous menu.', 'female', null, () => {
              this.toggleSpeak(false);
              this.playMenu()
            });
          })()
        } else if (this.voiceService.keywordMatch(result, 'more') && emails.nextPageToken) {
          return (() => {
            this.toggleSpeak(true);
            this.voiceService.speak('Fetching more emails.', 'female', null, () => {
              this.toggleSpeak(false);
              this.emailService.fetchEmail(emails.nextPageToken)
                .subscribe((result: any) => {
                  console.log(result);
                  this.emailMenu(result.data);
                })
            });
          })()
        } else {
          this.toggleSpeak(true);
          this.voiceService.speak('Sorry, i was not able to get that, please try again!', 'female', null, () => {
            return (() => {
              this.toggleSpeak(false);
              this.emailMenuInput(emails)
            })();
          })
        }
      });
  }

  emailMenu(emails) {
    this.toggleSpeak(true);
    this.voiceService.speak('Your emails have been fetched. Please speak a number between 1 and ' + (emails.messages.length) + '.' + (emails.nextPageToken ? 'Or more, to fetch more emails' : '') , 'female', null, () => {
      this.voiceService.speak('Speak return, to return to previous menu', 'female', null, () => {
        this.toggleSpeak(false);
        this.emailMenuInput(emails);
      })
    })
  }

  magazineInput() {
    this.toggleListen(true);
    this.voiceService.listen()
      .then((result: string) => {
        this.toggleListen(false);
        if (result.split(' ').length !== 1 && result.match(/\d+/))
          result = result.match(/\d+/).join('');
        console.log('result', result);
        if (this.voiceService.keywordMatch(result, 'number') && parseInt(result) >= 1 && parseInt(result) <= 5) {
          this.toggleSpeak(true);
          this.voiceService.speak('Fetching magazine. Please wait.', 'female', null, () => {
            this.toggleSpeak(false);
            this.entertainmentService.fetchPdf(parseInt(result))
              .subscribe(pdf => {
                this.toggleSpeak(true);
                this.voiceService.speak(pdf.data, 'female', null, () => {
                  this.voiceService.speak('I have finished reading the magazine. Select another number, or speak return, to return to the previous menu.', 'female', null, () => {
                    this.toggleSpeak(false);
                    return this.magazineInput();
                  })
                })
              })
          })
        } else if (this.voiceService.keywordMatch(result, 'return')) {
          this.voiceService.speak('Returning to previous menu.', 'female', null, () => {
            return this.playMenu();
          })
        } else {
          this.toggleSpeak(true);
          this.voiceService.speak('Sorry, i was not able to get that. Please try again!', 'female', null, () => {
            this.toggleSpeak(false);
            return this.magazineInput();
          })
        }
      })
  }

  magazineMenu() {
    this.toggleSpeak(true);
    this.voiceService.speak('Please speak a number between 1 to 5, to fetch and read a magazine. Or return, to return to the previous menu', 'female', null, () => {
      this.toggleSpeak(false);
      return this.magazineInput();
    })
  }

  songInput() {
    this.toggleListen(true);
    this.voiceService.listen()
      .then((result: string) => {
        this.toggleListen(false);
        if (result.split(' ').length !== 1 && result.match(/\d+/))
          result = result.match(/\d+/).join('');
        console.log('result', result);
        if (this.voiceService.keywordMatch(result, 'number') && parseInt(result) >= 1 && parseInt(result) <= 5) {
          this.toggleSpeak(true);
          this.voiceService.speak('Playing song. Please wait.', 'female', null, () => {
            this.toggleSpeak(false);
            let music = new Audio(this.entertainmentService.fetchSongUrl(parseInt(result)));
            console.log(music);
            music.play();

            let endEvent = () => {
              this.toggleSpeak(true);
              this.voiceService.speak('I have finished playing the song. Select another number, or speak return, to return to the previous menu.', 'female', null, () => {
                this.toggleSpeak(false);
                return this.songInput();
              })
            }

            let pauseEvent = Observable.fromEvent(document.getElementsByTagName('body'), 'keyup')
              .filter($event => $event['key'] == 'w')
              .first()
              .subscribe($event => {
                console.log('paused');
                music.pause();
                music.currentTime = 0;
                music.src = '';
                endEvent();
              });

            music.onended = endEvent;
          })
        } else if (this.voiceService.keywordMatch(result, 'return')) {
          this.voiceService.speak('Returning to previous menu.', 'female', null, () => {
            return this.playMenu();
          })
        } else {
          this.toggleSpeak(true);
          this.voiceService.speak('Sorry, i was not able to get that. Please try again!', 'female', null, () => {
            this.toggleSpeak(false);
            return this.songInput();
          })
        }
      })
  }

  songMenu() {
    this.toggleSpeak(true);
    this.voiceService.speak('Please speak a number between 1 to 5, to fetch and play a song. Or return, to return to the previous menu', 'female', null, () => {
      this.toggleSpeak(false);
      return this.songInput();
    })
  }

  voiceInput() {
    this.toggleListen(true);
    this.voiceService.listen()
      .then((result: string) => {
        this.toggleListen(false);
        console.log(result);
        if (this.voiceService.keywordMatch(result, 'logout')) {
          this.toggleSpeak(true);
          this.voiceService.speak('Logging out', 'female', null, () => {
            this.toggleSpeak(false);
            this.authService.logout().subscribe(response => {
              console.log(response);
              this.router.navigate(['login']);
            });
          });
        } else if (this.voiceService.keywordMatch(result, 'repeat')) {
          return this.playMenu();
        } else if (this.voiceService.keywordMatch(result, 'fetchMail')) {
          this.toggleSpeak(true);
          this.voiceService.speak('Fetching emails. Please wait.', 'female', null, () => {
            this.toggleSpeak(false);
            return this.emailService.fetchEmail()
              .subscribe((result: any) => {
                console.log(result);
                this.emailMenu(result.data);
              })
          })
          return;
        } else if (this.voiceService.keywordMatch(result, 'send')) {
          this.inputEmailAddress();
        } else if (this.voiceService.keywordMatch(result, 'magazine')) {
          this.magazineMenu();
        } else if (this.voiceService.keywordMatch(result, 'song')) {
          this.songMenu();
        } else {
          this.toggleSpeak(true);
          this.voiceService.speak('Sorry, i was not able to get that. Please try again!', 'female', null, () => {
            this.toggleSpeak(false);
            this.voiceInput();
          });
          return;
        }
      })
  }

  playIntro() {
    let intro = 'You have successfully logged in. Please use the menu to navigate. Speak one of the following options.'
    this.voiceService.speak(intro, 'female', null, this.playMenu.bind(this));
  }

  playMenu() {
    let menu = 'Speak check mail, to check your email. Send mail, to send email. Read magazine, to read a magazine. Play song, to play a song. Logout, to logout of the system. Or repeat, to repeat the menu.'
    this.toggleSpeak(true);
    this.voiceService.speak(menu, 'female', null, () => {
      this.toggleSpeak(false);
      this.voiceInput();
    })
  }

  inputEmailAddress() {
    this.toggleSpeak(true);
    this.voiceService.speak('Please speak the email address of the recipient.', 'female', null, () => {
      this.toggleSpeak(false);
      this.toggleListen(true);
      this.voiceService.listen()
        .then((emailAddress: string) => {
          this.toggleListen(false);
          let _emailAddress = emailAddress.replace(/\s+/g, '').toLocaleLowerCase();
          console.log(_emailAddress);
          let emailRegex = /\S+@\S+\.\S+/;
          if (!emailRegex.test(_emailAddress)) {
            return (() => {
              this.toggleSpeak(true);
              this.voiceService.speak('Sorry, please provide a valid email address.', 'female', null, () => {
                this.toggleSpeak(false);
                this.inputEmailAddress();
              })
            })()
          } else {
            this.inputEmailSubject(_emailAddress);
          }
        });
    })
  }

  inputEmailSubject(emailAddress: string) {
    this.toggleSpeak(true);
    this.voiceService.speak('Please speak the subject of the email.', 'female', null, () => {
      this.toggleSpeak(false);
      this.voiceService.listen()
        .then((subject: string) => {
          console.log(subject);
          if (subject.trim() === '') {
            return (() => {
              this.toggleSpeak(true);
              this.voiceService.speak('Sorry, please provide a valid subject.', 'female', null, () => {
                this.toggleSpeak(false);
                this.inputEmailSubject(emailAddress);
              })
            })()
          } else {
            this.inputEmailBody(emailAddress, subject);
          }
        });
    })
  }

  inputEmailBody(emailAddress, subject) {
    this.toggleSpeak(true);
    this.voiceService.speak('Please speak the message.', 'female', null, () => {
      this.toggleSpeak(false);
      this.voiceService.listen(true)
        .then((message: string) => {
          console.log(message)
          if (message.trim() === '') {
            return (() => {
              this.toggleSpeak(true);
              this.voiceService.speak('Sorry, please provide an email body.', 'female', null, () => {
                this.toggleSpeak(false);
                this.inputEmailBody(emailAddress, subject);
              })
            })()
          } else {
            this.sendEmail(emailAddress, subject, message);
          }
        });
    })
  }

  sendEmail(emailAddress: string, subject: string, body: string) {
    let mail = {
      emailAddress, subject, body
    };
    console.log(mail);
    this.toggleSpeak(true);
    this.voiceService.speak('Are you sure you want to send the email?', 'female', null, () => {
      this.toggleSpeak(false);
      this.toggleListen(true);
      this.voiceService.listen()
        .then((result: string) => {
          this.toggleListen(false);
          if (this.voiceService.keywordMatch(result, 'yes')) {
            console.log('yes');
            return (() => {
              this.emailService.sendEmail(emailAddress, subject, body)
                .subscribe(result => {
                  console.log(result);
                  this.toggleSpeak(true);
                  this.voiceService.speak('Your email has been sent successfully!', 'female', null, () => {
                    this.toggleSpeak(false);
                    this.playMenu();
                  })
                })
            })()
          } else if (this.voiceService.keywordMatch(result, 'no')) {
            this.toggleSpeak(true);
            this.voiceService.speak('Discarding email and returning to previous menu.', 'female', null, () => {
              this.toggleSpeak(false);
              this.playMenu();
            })
          } else {
            return (() => {
              this.voiceService.speak('Sorry i was not able to get that, please try again!', 'female', null, () => {
                this.sendEmail(emailAddress, subject, body);
              })
            })()
          }
        })
    })
  }

  constructor(private voiceService: VoiceService, private authService: AuthService, private router: Router, private emailService: EmailService, private changeDetector: ChangeDetectorRef, private entertainmentService: EntertainmentService) { }

  ngOnInit() {
    this.playIntro();
  }

  clickLogout() {
  }

  toggleSpeak(toggle: boolean) {
    this.speaking = toggle;
    this.changeDetector.detectChanges();
  }

  toggleListen(toggle: boolean) {
    this.listening = toggle;
    this.changeDetector.detectChanges();
  }
}
